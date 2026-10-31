// The room: the page's room model (public/models/room.glb, or a mockup's) when it exists,
// otherwise a provisional room built in code with the same named empties
// (contracts/scene-model.md, specs/003-visual-design-pass/contracts/scene-ambiance.md).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { parseSlot, type Slot } from './layout';

export interface RoomSlot extends Slot {
  object: THREE.Object3D;
}

export interface Room {
  group: THREE.Object3D;
  slots: RoomSlot[];
  /** Initial camera target. */
  home: THREE.Vector3;
  /** Limits of the camera target. */
  bounds: THREE.Box3;
  /** `light.lamp.NN` empties: where the night point lights go. */
  lamps: THREE.Object3D[];
  /** Materials named `lamp` (shades, bulbs) and `window` (glass), driven by the ambiance. */
  lampMaterials: THREE.MeshStandardMaterial[];
  windowMaterials: THREE.MeshStandardMaterial[];
}

export const ROOM_URL = '/models/room.glb';

let loader: GLTFLoader | undefined;
export function gltfLoader(): GLTFLoader {
  loader ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

/** Reads slots, camera home and bounds from the named empties of a room. */
function describe(group: THREE.Object3D): Room {
  const slots: RoomSlot[] = [];
  const lamps: THREE.Object3D[] = [];
  const lampMaterials = new Set<THREE.MeshStandardMaterial>();
  const windowMaterials = new Set<THREE.MeshStandardMaterial>();
  let home = new THREE.Vector3(0, 0.8, 0);
  let bounds = new THREE.Box3(new THREE.Vector3(-4, 0, -4), new THREE.Vector3(4, 3, 4));
  group.updateMatrixWorld(true);
  group.traverse((object) => {
    // GLTFLoader strips dots from node names and keeps the original in userData.name.
    const name: string = object.userData.name ?? object.name;
    const slot = parseSlot(name);
    if (slot) slots.push({ ...slot, object });
    if (/^light\.lamp\.\d+$/.test(name)) lamps.push(object);
    const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (material && 'emissive' in material) {
      if (material.name === 'lamp') lampMaterials.add(material);
      if (material.name === 'window') windowMaterials.add(material);
    }
    if (name === 'camera.home') home = object.getWorldPosition(new THREE.Vector3());
    if (name === 'bounds') {
      const center = object.getWorldPosition(new THREE.Vector3());
      const half = object.getWorldScale(new THREE.Vector3());
      bounds = new THREE.Box3(center.clone().sub(half), center.clone().add(half));
    }
  });
  return {
    group,
    slots,
    home,
    bounds,
    lamps,
    lampMaterials: [...lampMaterials],
    windowMaterials: [...windowMaterials],
  };
}

/** `url`: the page's room (a mockup sets its own); otherwise room.glb when it was built. */
export async function loadRoom(models: string[], url?: string): Promise<Room> {
  const src = url ?? (models.includes('room.glb') ? ROOM_URL : null);
  if (!src) return describe(provisionalRoom());
  const gltf = await gltfLoader().loadAsync(src);
  return describe(gltf.scene);
}

const material = (color: string, name = '') =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, name });

function box(
  w: number,
  h: number,
  d: number,
  color: string,
  x: number,
  y: number,
  z: number,
  name?: string,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, name));
  mesh.position.set(x, y, z);
  return mesh;
}

function empty(name: string, x: number, y: number, z: number, rotationY = 0) {
  const object = new THREE.Object3D();
  object.name = name;
  object.position.set(x, y, z);
  object.rotation.y = rotationY;
  return object;
}

/**
 * Provisional room, 8 × 8 m: floor, west and north walls, a table for projects, diplomas on the
 * west wall, a board for experience on the north wall. Replaced by room.glb once modelled.
 */
export function provisionalRoom(): THREE.Group {
  const room = new THREE.Group();
  room.name = 'room';
  const pad = (n: number) => String(n).padStart(2, '0');

  room.add(box(8, 0.1, 8, '#d9cbb8', 0, -0.05, 0)); // floor
  room.add(box(0.15, 3, 8, '#eeeae4', -4.075, 1.5, 0)); // west wall
  room.add(box(8, 3, 0.15, '#f3efe9', 0, 1.5, -4.075)); // north wall
  room.add(box(3.2, 0.08, 1.6, '#8a6a4f', 0.6, 0.76, 0.4)); // table top
  for (const [x, z] of [
    [-0.9, -0.3],
    [2.1, -0.3],
    [-0.9, 1.1],
    [2.1, 1.1],
  ]) {
    room.add(box(0.08, 0.72, 0.08, '#6f533d', x!, 0.36, z!)); // table legs
  }
  room.add(box(2.6, 1.4, 0.05, '#c9a87c', 1.6, 1.75, -3.97)); // board
  room.add(box(1.6, 0.05, 1, '#b04a4a', -2.6, 0.03, 2.4)); // rug
  room.add(box(1.1, 0.9, 0.04, '#cfe6f5', -2.2, 1.95, -3.98, 'window')); // window glass
  room.add(box(0.04, 1.5, 0.04, '#3a3d42', -3.5, 0.75, 3.4)); // floor lamp
  room.add(box(0.36, 0.26, 0.36, '#f4e3c1', -3.5, 1.6, 3.4, 'lamp')); // lampshade
  room.add(empty('light.lamp.01', -3.5, 1.6, 3.4));

  // Projects: 6 on the table, facing the camera (+X+Z).
  for (let i = 0; i < 6; i++) {
    const x = -0.4 + (i % 3) * 1;
    const z = i < 3 ? 0.05 : 0.75;
    room.add(empty(`slot.project.${pad(i + 1)}`, x, 0.8, z, Math.PI / 4));
  }
  // Diplomas: 4 frames on the west wall, facing +X.
  for (let i = 0; i < 4; i++) {
    room.add(
      empty(
        `slot.education.${pad(i + 1)}`,
        -3.97,
        i < 2 ? 2.1 : 1.45,
        -2.4 + (i % 2) * 1.2,
        Math.PI / 2,
      ),
    );
  }
  // Experience: 4 cards on the board, facing +Z.
  for (let i = 0; i < 4; i++) {
    room.add(
      empty(`slot.experience.${pad(i + 1)}`, 0.95 + (i % 2) * 1.3, i < 2 ? 2.1 : 1.45, -3.93),
    );
  }
  room.add(empty('camera.home', 0, 0.9, -0.4));
  const bounds = empty('bounds', 0, 1.5, 0);
  bounds.scale.set(4, 1.5, 4);
  room.add(bounds);
  return room;
}
