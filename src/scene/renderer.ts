// Renderer, isometric camera and pan / zoom controls, rendering on demand (research § 2, § 7).
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';

export interface CameraView {
  x: number;
  z: number;
  zoom: number;
}

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  controls: MapControls;
  /** Asks for one frame; frames are only drawn when something changed. */
  requestRender(): void;
  /** Moves the camera target (animated unless motion is reduced). */
  moveTo(target: THREE.Vector3, zoom?: number): void;
  view(): CameraView;
  setView(view: CameraView): void;
  frames(): number;
  /** Caps the device pixel ratio (adaptive quality). */
  setPixelRatio(ratio: number): void;
  /** World position -> pixels inside the canvas. */
  toScreen(position: THREE.Vector3): { x: number; y: number };
  /** After each frame, with the time that frame was asked for (performance.now()). */
  onRender(listener: (requestedAt: number) => void): void;
  /** Reads `--scene-bg` again (after a theme change). */
  refreshBackground(): void;
  dispose(): void;
}

/** Initial and "recenter" zoom: at zoom 1 the whole room fits the view. */
export const HOME_ZOOM = 1;
/** Empty space kept around the room at zoom 1. */
const FIT_MARGIN = 1.04;
const DISTANCE = 20;
// Isometric direction (1, 1, 1): azimuth 45°, elevation ≈ 35.26°.
const ISO = new THREE.Vector3(1, 1, 1).normalize();

export function createStage(
  container: HTMLElement,
  options: { home: THREE.Vector3; bounds: THREE.Box3; reducedMotion: boolean; pixelRatio: number },
): Stage {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  // Lights come from lighting.ts (day / night); the background is the `--scene-bg` role.
  const background = new THREE.Color();
  scene.background = background;
  const refreshBackground = () => {
    background.setStyle(getComputedStyle(container).getPropertyValue('--scene-bg').trim());
  };
  refreshBackground();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const controls = new MapControls(camera, renderer.domElement);
  controls.enableRotate = false;
  controls.enableDamping = false;
  controls.screenSpacePanning = false;
  controls.minZoom = 0.8;
  controls.maxZoom = 4;
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };

  let frameCount = 0;
  let pending = false;
  const listeners: ((requestedAt: number) => void)[] = [];
  let requestedAt = 0;

  const placeCamera = () => {
    camera.position.copy(controls.target).addScaledVector(ISO, DISTANCE);
    camera.lookAt(controls.target);
  };

  const render = () => {
    pending = false;
    if (document.hidden) return; // FR-025: nothing drawn in the background
    renderer.render(scene, camera);
    frameCount++;
    for (const l of listeners) l(requestedAt);
  };
  const requestRender = () => {
    if (pending) return;
    pending = true;
    requestedAt = performance.now();
    requestAnimationFrame(render);
  };

  // Half-width and half-height of the room as seen from the camera at its home position: the
  // view is sized so that the room fits at zoom 1, whatever the screen's shape.
  const extents = (() => {
    const view = new THREE.Object3D();
    view.position.copy(options.home).addScaledVector(ISO, DISTANCE);
    view.lookAt(options.home);
    view.updateMatrixWorld();
    const inverse = view.matrixWorld.clone().invert();
    const center = options.home.clone().applyMatrix4(inverse);
    const { min, max } = options.bounds;
    let x = 0;
    let y = 0;
    for (const cx of [min.x, max.x])
      for (const cy of [min.y, max.y])
        for (const cz of [min.z, max.z]) {
          const p = new THREE.Vector3(cx, cy, cz).applyMatrix4(inverse);
          x = Math.max(x, Math.abs(p.x - center.x));
          y = Math.max(y, Math.abs(p.y - center.y));
        }
    return { x, y };
  })();

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const half = Math.max(extents.y, extents.x / aspect) * FIT_MARGIN;
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    requestRender();
  };

  // Keep the target inside the room's bounds (FR-004).
  const clampTarget = () => {
    controls.target.x = THREE.MathUtils.clamp(
      controls.target.x,
      options.bounds.min.x,
      options.bounds.max.x,
    );
    controls.target.z = THREE.MathUtils.clamp(
      controls.target.z,
      options.bounds.min.z,
      options.bounds.max.z,
    );
    controls.target.y = options.home.y;
    placeCamera();
  };

  controls.target.copy(options.home);
  camera.zoom = HOME_ZOOM;
  camera.updateProjectionMatrix();
  placeCamera();
  controls.addEventListener('change', () => {
    clampTarget();
    requestRender();
  });

  let animation = 0;
  const moveTo = (target: THREE.Vector3, zoom = camera.zoom) => {
    cancelAnimationFrame(animation);
    const to = new THREE.Vector3(target.x, options.home.y, target.z);
    if (options.reducedMotion) {
      controls.target.copy(to);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      clampTarget();
      requestRender();
      return;
    }
    const from = controls.target.clone();
    const fromZoom = camera.zoom;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 450);
      const ease = 1 - (1 - t) ** 3;
      controls.target.lerpVectors(from, to, ease);
      camera.zoom = fromZoom + (zoom - fromZoom) * ease;
      camera.updateProjectionMatrix();
      clampTarget();
      render();
      if (t < 1) animation = requestAnimationFrame(step);
    };
    animation = requestAnimationFrame(step);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  document.addEventListener('visibilitychange', requestRender);
  resize();

  return {
    renderer,
    scene,
    camera,
    controls,
    requestRender,
    moveTo,
    view: () => ({ x: controls.target.x, z: controls.target.z, zoom: camera.zoom }),
    setView: (view) => {
      controls.target.set(view.x, options.home.y, view.z);
      camera.zoom = THREE.MathUtils.clamp(view.zoom, controls.minZoom, controls.maxZoom);
      camera.updateProjectionMatrix();
      clampTarget();
      requestRender();
    },
    frames: () => frameCount,
    setPixelRatio: (ratio) => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratio));
      resize();
    },
    toScreen: (position) => {
      // The camera may have moved since the last frame: refresh its matrices first.
      camera.updateMatrixWorld();
      const p = position.clone().project(camera);
      return {
        x: ((p.x + 1) / 2) * container.clientWidth,
        y: ((1 - p.y) / 2) * container.clientHeight,
      };
    },
    onRender: (listener) => listeners.push(listener),
    refreshBackground: () => {
      refreshBackground();
      requestRender();
    },
    dispose: () => {
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
    },
  };
}
