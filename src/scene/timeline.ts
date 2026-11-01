// The experience board (spec 003): its title, and the chevrons that lead from card to card in
// time order.
import * as THREE from 'three';

// Unlit: the same red on the whole board, wherever the lamps reach, by day and by night.
const CHEVRON = new THREE.MeshBasicMaterial({ color: '#b3261e' });
const ARM_LENGTH = 0.085;
const ARM_WIDTH = 0.024;
const ARM_DEPTH = 0.006;
const LIFT = 0.004;

/** The board's lit title, above the cards and centred on them; it never takes a click. */
export function experienceTitle(cards: THREE.Object3D[], text: string): THREE.Mesh | null {
  const first = cards[0];
  if (!first) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 168;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1d1e20';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffcf8a';
  ctx.font = '700 92px "Space Grotesk Variable", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, 90, 700);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(0.64, 0.14),
    new THREE.MeshBasicMaterial({ map }),
  );
  title.name = 'experience-title';
  const box = new THREE.Box3();
  for (const card of cards) box.expandByObject(card);
  const center = box.getCenter(new THREE.Vector3());
  title.position.set(center.x, box.max.y + 0.17, box.max.z + 0.001);
  title.quaternion.copy(first.quaternion);
  title.raycast = () => {};
  return title;
}

/**
 * A chevron in the gap between each two cards, centred on it, pointing forward in time; `cards`
 * go from the most recent to the oldest. Null for fewer than two cards.
 */
export function experienceChevrons(cards: THREE.Object3D[]): THREE.Group | null {
  if (cards.length < 2) return null;
  const group = new THREE.Group();
  group.name = 'experience-chevrons';
  const arm = new THREE.BoxGeometry(ARM_LENGTH, ARM_WIDTH, ARM_DEPTH);
  const boxes = cards.map((card) => new THREE.Box3().setFromObject(card));
  for (let i = 1; i < boxes.length; i++) {
    const newer = boxes[i - 1]!.getCenter(new THREE.Vector3());
    const older = boxes[i]!.getCenter(new THREE.Vector3());
    const chevron = new THREE.Group();
    chevron.position.copy(newer).add(older).multiplyScalar(0.5);
    // Flat on the cork: any higher, the view from above would shift it off the middle of the gap.
    chevron.position.z = cards[i]!.position.z + LIFT;
    // The board faces +Z: the chevron turns in its plane, its tip towards the newer card.
    chevron.rotation.z = Math.atan2(newer.y - older.y, newer.x - older.x);
    for (const side of [1, -1]) {
      const part = new THREE.Mesh(arm, CHEVRON);
      // Each arm is centred on the group's axis along its length: tip and tails are equally far.
      part.position.set(0, (side * ARM_LENGTH * Math.SQRT1_2) / 2, 0);
      part.rotation.z = (-side * Math.PI) / 4;
      part.raycast = () => {};
      chevron.add(part);
    }
    group.add(chevron);
  }
  return group;
}
