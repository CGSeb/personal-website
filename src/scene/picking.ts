// Pointer interaction: hover highlights an object and shows its name, a click or tap selects it.
// A click that ends a drag, or a double click, does not select (edge cases).
import * as THREE from 'three';
import type { PlacedObject } from './objects';

const DRAG_TOLERANCE = 6; // px

export interface PickingHandlers {
  onHover(key: string | null, at: { x: number; y: number }): void;
  onSelect(key: string | null): void;
}

export function attachPicking(
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  objects: PlacedObject[],
  handlers: PickingHandlers,
): () => void {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hits = objects.map((o) => o.hit);
  let down: { x: number; y: number; id: number } | null = null;
  let hovered: string | null = null;

  const pick = (event: PointerEvent): string | null => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hits, false)[0];
    return (hit?.object.userData.key as string | undefined) ?? null;
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || down) return; // no hover while dragging or on touch
    const key = pick(event);
    const rect = canvas.getBoundingClientRect();
    if (key !== hovered) {
      hovered = key;
      canvas.style.cursor = key ? 'pointer' : 'grab';
    }
    handlers.onHover(key, { x: event.clientX - rect.left, y: event.clientY - rect.top });
  };
  const onDown = (event: PointerEvent) => {
    down = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const onUp = (event: PointerEvent) => {
    const start = down;
    down = null;
    if (!start || start.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_TOLERANCE) return;
    if (event.detail > 1) return; // double click
    handlers.onSelect(pick(event));
  };
  const onLeave = () => {
    hovered = null;
    handlers.onHover(null, { x: 0, y: 0 });
  };

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.style.cursor = 'grab';
  return () => {
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointerleave', onLeave);
  };
}
