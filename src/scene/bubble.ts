// Position of the figure's welcome bubble (contracts/avatar.md). Pure, unit tested.
// The `Bubble` class (DOM, focus, fragment) comes with T023 of specs/004-scene-avatar/tasks.md.

/** Above the anchor, centred, kept inside the scene. Pure. */
export function bubblePosition(
  anchor: { x: number; y: number },
  bubble: { width: number; height: number },
  scene: { width: number; height: number },
  margin = 8,
): { left: number; top: number } {
  // The upper bound comes second: a bubble too large for the scene stays on its top left margin.
  const clamp = (value: number, max: number) => Math.max(margin, Math.min(value, max));
  return {
    left: clamp(anchor.x - bubble.width / 2, scene.width - bubble.width - margin),
    top: clamp(anchor.y - bubble.height - margin, scene.height - bubble.height - margin),
  };
}
