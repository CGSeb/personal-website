// Applies day / night settings (ambiance.ts) to the scene: ambient and sun lights, lamp glow,
// window glass and the night point lights at the room's `light.lamp.NN` empties.
import * as THREE from 'three';
import { LAMP_GLOW, type AmbianceSettings } from './ambiance';
import type { Room } from './room';

export interface Lighting {
  apply(settings: AmbianceSettings): void;
}

export function createLighting(scene: THREE.Scene, room: Room): Lighting {
  const hemisphere = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  scene.add(hemisphere, sun);
  const points = room.lamps.map((lamp) => {
    const light = new THREE.PointLight();
    light.decay = 2;
    lamp.getWorldPosition(light.position);
    scene.add(light);
    return light;
  });
  const glow = new THREE.Color(LAMP_GLOW);
  for (const m of room.lampMaterials) m.emissive.copy(glow);
  for (const m of room.neonMaterials) m.emissive.copy(m.color);

  return {
    apply(s) {
      hemisphere.color.setStyle(s.hemisphere.sky);
      hemisphere.groundColor.setStyle(s.hemisphere.ground);
      hemisphere.intensity = s.hemisphere.intensity;
      sun.color.setStyle(s.sun.color);
      sun.intensity = s.sun.intensity;
      sun.position.set(...s.sun.position);
      for (const m of room.lampMaterials) m.emissiveIntensity = s.lampEmissive;
      for (const m of room.neonMaterials) m.emissiveIntensity = s.neonEmissive;
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
    },
  };
}
