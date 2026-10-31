// The red string of the experience board (spec 003): pins of the experience cards joined in
// time order. Each card model marks its pin with the material `pin`; cards without one are
// joined at their top centre.
import * as THREE from 'three';

const STRING = new THREE.MeshStandardMaterial({ color: '#b3261e', roughness: 0.6 });
const RADIUS = 0.004;

function pinOf(card: THREE.Object3D): THREE.Vector3 {
  let pin: THREE.Object3D | undefined;
  card.traverse((o) => {
    const material = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (!pin && material?.name === 'pin') pin = o;
  });
  if (pin) return pin.getWorldPosition(new THREE.Vector3());
  const box = new THREE.Box3().setFromObject(card);
  return new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
}

/** A thin string from card to card, in the given order; null for fewer than two cards. */
export function experienceString(cards: THREE.Object3D[]): THREE.Group | null {
  if (cards.length < 2) return null;
  const group = new THREE.Group();
  group.name = 'experience-string';
  const pins = cards.map(pinOf);
  for (let i = 1; i < pins.length; i++) {
    const a = pins[i - 1]!;
    const b = pins[i]!;
    const length = a.distanceTo(b);
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(RADIUS, RADIUS, length, 6), STRING);
    segment.position.copy(a).add(b).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    segment.raycast = () => {};
    group.add(segment);
  }
  return group;
}
