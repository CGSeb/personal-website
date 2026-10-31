// Objects that represent the items (contracts/scene-model.md): generic, dedicated (featured
// projects) or overflow boxes, placed at their slots, with hit shapes and highlight states.
import * as THREE from 'three';
import type { Placement, SceneItem } from './layout';
import { gltfLoader, type RoomSlot } from './room';

export type ObjectState = 'idle' | 'highlighted' | 'selected';

export interface PlacedObject {
  key: string;
  root: THREE.Object3D;
  hit: THREE.Mesh;
  setState(state: ObjectState): void;
}

const HIGHLIGHT = new THREE.Color('#ffb020');
/** Coded stand-ins are drawn larger than life so they read well from the isometric view. */
const STAND_IN_SCALE = 1.6;
/** Hit shapes are larger than the objects, more so for fingers (US3). */
const HIT_SCALE = matchMedia('(pointer: coarse)').matches ? 1.6 : 1.3;
const SELECTED = new THREE.Color('#ff7a00');

/** A small canvas texture with a short badge (never the full content). */
function badgeTexture(text: string, background: string, color = '#2b2b2b'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = '600 44px "Inter Variable", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Up to two lines.
  const words = text.split(' ');
  const lines: string[] = [''];
  for (const word of words) {
    const candidate = `${lines[lines.length - 1]} ${word}`.trim();
    if (ctx.measureText(candidate).width > 460 && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = candidate;
  }
  lines.forEach((line, i) => ctx.fillText(line, 256, 160 + (i - (lines.length - 1) / 2) * 56));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const textureLoader = new THREE.TextureLoader();
function imageTexture(url: string, onLoad: () => void): THREE.Texture {
  const texture = textureLoader.load(url, onLoad);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const standard = (params: THREE.MeshStandardMaterialParameters) =>
  new THREE.MeshStandardMaterial({ roughness: 0.7, ...params });

/** Coded stand-ins, used until the generic .glb models exist. */
function standIn(placement: Placement, item: SceneItem | undefined, requestRender: () => void) {
  const group = new THREE.Group();
  if (placement.model === 'overflow') {
    const count = placement.items?.length ?? 0;
    const carton = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.36, 0.4),
      standard({ color: '#b98a55' }),
    );
    carton.position.y = 0.18;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.25),
      standard({ map: badgeTexture(`+${count}`, '#f6efe3') }),
    );
    label.position.set(0, 0.2, 0.201);
    group.add(carton, label);
    return group;
  }
  if (placement.model === 'generic-education') {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.34, 0.03),
      standard({ color: '#3b3127' }),
    );
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.28),
      standard({ map: badgeTexture(item?.badge || '🎓', '#fbf8f1') }),
    );
    label.position.z = 0.016;
    group.add(frame, label);
    return group;
  }
  if (placement.model === 'generic-experience') {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.32),
      standard({ map: badgeTexture(item?.badge || '', '#fffdf6'), side: THREE.DoubleSide }),
    );
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), standard({ color: '#d33' }));
    pin.position.set(0, 0.13, 0.02);
    group.add(card, pin);
    return group;
  }
  // Project (generic, or featured without its own model yet): a screen on a stand.
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.4, 0.04),
    standard({ color: '#222831' }),
  );
  screen.position.y = 0.32;
  const picture = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.35),
    item?.image
      ? new THREE.MeshBasicMaterial({ map: imageTexture(item.image, requestRender) })
      : standard({ map: badgeTexture(item?.badge || '', '#e8eaf6') }),
  );
  picture.position.set(0, 0.32, 0.021);
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.12),
    standard({ color: '#555' }),
  );
  stand.position.y = 0.06;
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.015, 24),
    standard({ color: '#555' }),
  );
  group.add(screen, picture, stand, foot);
  return group;
}

// One request per model file, shared by every object that uses it.
const models = new Map<string, Promise<THREE.Object3D | null>>();

async function fetchModel(url: string): Promise<THREE.Object3D | null> {
  try {
    return (await gltfLoader().loadAsync(url)).scene;
  } catch {
    return null;
  }
}

async function loadFile(file: string, available: Set<string>): Promise<THREE.Object3D | null> {
  if (!available.has(file)) return null;
  const url = `/models/${file}`;
  if (!models.has(url)) models.set(url, fetchModel(url));
  const model = await models.get(url)!;
  return model ? model.clone(true) : null;
}

/**
 * The model of a placement. A featured project whose dedicated file is missing or broken gets
 * the generic project model (US6-3); null means the coded stand-in.
 */
async function loadModel(
  placement: Placement,
  available: Set<string>,
): Promise<THREE.Object3D | null> {
  if (!placement.model.startsWith('featured:'))
    return loadFile(`${placement.model}.glb`, available);
  const id = placement.model.slice('featured:'.length);
  return (
    (await loadFile(`featured/${id}.glb`, available)) ?? loadFile('generic-project.glb', available)
  );
}

/** Applies a project image or a badge to the replaceable surfaces of a loaded model. */
function fillSurfaces(
  model: THREE.Object3D,
  item: SceneItem | undefined,
  requestRender: () => void,
) {
  model.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (material.name === 'screen' && item?.image) {
      mesh.material = new THREE.MeshBasicMaterial({ map: imageTexture(item.image, requestRender) });
    } else if (material.name === 'label' && item) {
      mesh.material = standard({ map: badgeTexture(item.badge, '#fbf8f1') });
    }
  });
}

export async function placeObjects(
  placements: Placement[],
  slots: RoomSlot[],
  items: SceneItem[],
  requestRender: () => void,
  models: string[],
): Promise<PlacedObject[]> {
  const available = new Set(models);
  const bySlot = new Map(slots.map((s) => [s.name, s]));
  return Promise.all(
    placements.map(async (placement) => {
      const slot = bySlot.get(placement.slot)!;
      const item = items.find((i) => i.key === placement.key);
      const model = await loadModel(placement, available);
      const root = model ?? standIn(placement, item, requestRender);
      if (model) {
        // Clones share materials: give each object its own so highlighting stays local.
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) mesh.material = (mesh.material as THREE.Material).clone();
        });
        fillSurfaces(model, item, requestRender);
      }
      root.name = `object:${placement.key}`;
      if (!model) root.scale.setScalar(STAND_IN_SCALE);
      slot.object.getWorldPosition(root.position);
      slot.object.getWorldQuaternion(root.quaternion);

      // Invisible, larger hit shape: easier to touch on phones.
      const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(size.x, 0.3) * HIT_SCALE,
          Math.max(size.y, 0.3) * HIT_SCALE,
          Math.max(size.z, 0.3) * HIT_SCALE,
        ),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
      hit.position.copy(center);
      hit.userData.key = placement.key;

      const materials: THREE.MeshStandardMaterial[] = [];
      root.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (m && 'emissive' in m) materials.push(m);
      });
      const setState = (state: ObjectState) => {
        for (const m of materials) {
          m.emissive.copy(
            state === 'selected'
              ? SELECTED
              : state === 'highlighted'
                ? HIGHLIGHT
                : new THREE.Color(0),
          );
          m.emissiveIntensity = state === 'idle' ? 0 : 0.35;
        }
      };
      return { key: placement.key, root, hit, setState };
    }),
  );
}
