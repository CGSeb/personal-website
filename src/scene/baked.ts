// Baked rooms (contracts/scene-ambiance.md, « pièce précalculée »): the room's light is computed
// in Blender and stored in two textures, day and night, next to the model
// (<room>-day.webp, <room>-night.webp). Its mesh carries the material `baked` (gltfpack drops
// mesh names, not material names). The room is drawn unlit with a mix of both textures; the
// placed objects keep the real-time lights.
import * as THREE from 'three';

/** Day and night textures of a baked room model. */
export interface BakedMaps {
  day: string;
  night: string;
}

/** Addresses of the textures, next to the model. */
export const bakedTextureUrls = (roomUrl: string): BakedMaps => ({
  day: roomUrl.replace(/\.glb$/, '-day.webp'),
  night: roomUrl.replace(/\.glb$/, '-night.webp'),
});

export interface BakedMaterial extends THREE.ShaderMaterial {
  /** 0 = day texture, 1 = night texture. */
  setNight(t: number): void;
}

export async function loadBakedMaterial(urls: BakedMaps): Promise<BakedMaterial> {
  const loader = new THREE.TextureLoader();
  const [day, night] = await Promise.all([
    loader.loadAsync(urls.day),
    loader.loadAsync(urls.night),
  ]);
  for (const texture of [day, night]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false; // glTF texture coordinates
    texture.anisotropy = 4;
  }
  const material = new THREE.ShaderMaterial({
    uniforms: { dayMap: { value: day }, nightMap: { value: night }, night: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D dayMap;
      uniform sampler2D nightMap;
      uniform float night;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(mix(texture2D(dayMap, vUv).rgb, texture2D(nightMap, vUv).rgb, night), 1.0);
        #include <colorspace_fragment>
      }`,
  }) as BakedMaterial;
  material.setNight = (t) => {
    material.uniforms.night!.value = t;
  };
  return material;
}
