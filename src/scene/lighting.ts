// Applies day / night settings (ambiance.ts) to the scene: ambient and sun lights, lamp glow,
// window glass, LED strips, and the night point lights at the room's `light.lamp.NN` (warm) and
// `light.neon.NN` (LED colour) empties.
import * as THREE from 'three';
import { LAMP_GLOW, type AmbianceSettings } from './ambiance';
import type { Room } from './room';

export interface Lighting {
  apply(settings: AmbianceSettings): void;
  /** Lets a placed object's lamps, LEDs and halos (`lamp`, `neon`, `glow`) follow the ambiance. */
  adopt(object: THREE.Object3D): void;
}

/** Warm light falling from a picture lamp: bright at the top, fading downwards and sideways. */
function glowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 0, 4, 64, 0, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false; // glTF texture coordinates: v = 0 at the top
  return texture;
}

export function createLighting(scene: THREE.Scene, room: Room): Lighting {
  const hemisphere = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  scene.add(hemisphere, sun);
  const pointAt = (marker: THREE.Object3D) => {
    const light = new THREE.PointLight();
    light.decay = 2;
    light.visible = false;
    marker.getWorldPosition(light.position);
    scene.add(light);
    return light;
  };
  const points = room.lamps.map(pointAt);
  const neonPoints = room.neonLights.map(pointAt);
  const glow = new THREE.Color(LAMP_GLOW);
  for (const m of room.lampMaterials) m.emissive.copy(glow);
  for (const m of room.neonMaterials) m.emissive.copy(m.color);
  // LED glows take the colour of the room's strips.
  const neonColor = room.neonMaterials[0]?.color ?? glow;
  for (const light of neonPoints) light.color.copy(neonColor);
  // A baked room is drawn as bright as its render; the objects placed in it get a warm fill so
  // they match it, stronger at night when the real-time lights alone leave them dark.
  const fill = new THREE.AmbientLight(glow, 0);
  if (room.baked) scene.add(fill);

  const glows: THREE.MeshBasicMaterial[] = [];
  let glowMap: THREE.Texture | undefined;
  let current: AmbianceSettings | undefined;

  return {
    adopt(object) {
      let neon: THREE.MeshStandardMaterial | undefined;
      object.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const m = mesh.material as THREE.MeshStandardMaterial;
        if (m.name === 'lamp') {
          m.emissive.copy(glow);
          room.lampMaterials.push(m);
        } else if (m.name === 'neon') {
          // An object's LEDs glow brighter than their (darker) surface colour.
          m.emissive.copy(m.color).multiplyScalar(1.8);
          room.neonMaterials.push(m);
          neon = m;
        } else if (m.name === 'glow') {
          glowMap ??= glowTexture();
          const halo = new THREE.MeshBasicMaterial({
            name: 'glow',
            map: glowMap,
            color: glow,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          mesh.material = halo;
          mesh.raycast = () => {}; // never in the way of a click
          glows.push(halo);
        }
      });
      // An object with LEDs (Voxel Shift's logo) also lights what is around it, like the room's
      // LED glows: at night, at high quality.
      if (neon) {
        const marker = new THREE.Object3D();
        new THREE.Box3().setFromObject(object).getCenter(marker.position);
        const light = pointAt(marker);
        light.color.copy(neon.color);
        neonPoints.push(light);
      }
      if (current) this.apply(current);
    },
    apply(s) {
      current = s;
      // Halos of the picture lamps: off by day, full at night.
      for (const m of glows) m.opacity = Math.min(1, s.lampEmissive / 2.2) * 0.8;
      hemisphere.color.setStyle(s.hemisphere.sky);
      hemisphere.groundColor.setStyle(s.hemisphere.ground);
      hemisphere.intensity = s.hemisphere.intensity;
      sun.color.setStyle(s.sun.color);
      sun.intensity = s.sun.intensity;
      sun.position.set(...s.sun.position);
      for (const m of room.lampMaterials) m.emissiveIntensity = s.lampEmissive;
      for (const m of room.neonMaterials) m.emissiveIntensity = s.neonEmissive;
      room.baked?.setNight(s.bakedNight);
      fill.intensity = 0.4 + 1.4 * s.bakedNight;
      for (const m of room.windowMaterials) {
        m.emissive.setStyle(s.window.color);
        m.emissiveIntensity = s.window.intensity;
      }
      for (const light of points) {
        // Hidden lights cost nothing; low quality keeps them off (FR-027).
        light.visible = s.pointLight !== null && s.pointLight.intensity > 0;
        if (s.pointLight) {
          light.color.setStyle(s.pointLight.color);
          light.intensity = s.pointLight.intensity;
          light.distance = s.pointLight.distance;
        }
      }
      for (const light of neonPoints) {
        light.visible = s.neonLight !== null && s.neonLight.intensity > 0;
        if (s.neonLight) {
          light.intensity = s.neonLight.intensity;
          light.distance = s.neonLight.distance;
        }
      }
    },
  };
}
