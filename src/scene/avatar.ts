// The figure of Sébastien at the desk (specs/004-scene-avatar/contracts/avatar.md): loaded on its
// own, placed at the room's `avatar.seat`, and waving with its `avatar.arm` node.
import * as THREE from 'three';
import { withHitShape, type PlacedObject } from './objects';
import { gltfLoader, type Room } from './room';
import { WAVE_MS, waveAngle } from './wave';

export const AVATAR_KEY = 'avatar';

const FILE = 'avatar.glb';
/** Axis of the shoulder: at a negative angle the forearm rises beside the head, clear of the face. */
const ARM_AXIS = new THREE.Vector3(1, 0, 0.2).normalize();

export interface Avatar extends PlacedObject {
  /** Plays the wave unless one is running or motion is reduced. */
  wave(): void;
  waving(): boolean;
  /** How many waves have started. */
  waves(): number;
  /** World position of the `avatar.head` anchor. */
  head(): THREE.Vector3;
}

const fetchFigure = async (): Promise<THREE.Object3D | null> => {
  try {
    return (await gltfLoader().loadAsync(`/models/${FILE}`)).scene;
  } catch {
    return null;
  }
};

/** Null when the model or the seat is missing, or the file fails: the scene goes on without it. */
export async function loadAvatar(
  room: Room,
  models: string[],
  options: { reducedMotion: boolean; requestRender(): void },
): Promise<Avatar | null> {
  const seat = room.avatarSeat;
  if (!seat || !models.includes(FILE)) return null;
  const root = await fetchFigure();
  if (!root) return null;

  // GLTFLoader strips dots from node names and keeps the original in userData.name.
  const node = (name: string) => {
    let found: THREE.Object3D | undefined;
    root.traverse((object) => {
      if (object.userData.name === name) found = object;
    });
    return found;
  };
  const arm = node('avatar.arm');
  const anchor = node('avatar.head');
  if (!arm || !anchor) return null;

  root.name = `object:${AVATAR_KEY}`;
  seat.getWorldPosition(root.position);
  seat.getWorldQuaternion(root.quaternion);
  // A faint tint: the objects' stronger one turns hair, beard and clothes into one flat colour.
  const placed = withHitShape(AVATAR_KEY, root, { highlighted: 0.05, selected: 0.08 });
  placed.hit.userData.yields = true; // every other object wins a shared click (picking.ts)

  // Only while the gesture runs, like the day / night fade: no frame at rest (FR-010).
  let frame = 0;
  let waves = 0;
  const rest = arm.quaternion.clone();
  const lift = new THREE.Quaternion();
  const wave = () => {
    if (frame !== 0 || options.reducedMotion) return;
    waves++;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      lift.setFromAxisAngle(ARM_AXIS, -waveAngle(elapsed));
      arm.quaternion.copy(rest).multiply(lift);
      options.requestRender();
      frame = elapsed < WAVE_MS ? requestAnimationFrame(step) : 0;
    };
    frame = requestAnimationFrame(step);
  };

  return {
    ...placed,
    wave,
    waving: () => frame !== 0,
    waves: () => waves,
    head: () => anchor.getWorldPosition(new THREE.Vector3()),
  };
}
