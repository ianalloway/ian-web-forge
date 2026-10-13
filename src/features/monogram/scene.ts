import * as THREE from 'three';
import gsap from 'gsap';
import { AsciiPass } from './ascii/AsciiPass';
import { createGlyphAtlas, RAMP } from './ascii/atlas';

export type ModelKey =
  | 'monogram'
  | 'solvent'
  | 'advantage'
  | 'juryrig'
  | 'kelly'
  | 'ratings'
  | 'sentry'
  | 'training';

export type Side = 'hero' | 'work';

const COLOURS = { text: 0xd9d7cc, accent: 0x7cff6b, background: 0x0b0c0a };
const MOBILE = 768;

function buildModels() {
  const solid = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05 });
  const flat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 });
  const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0, rz = 0, material = solid) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    return mesh;
  };
  const group = (...children: THREE.Object3D[]) => {
    const g = new THREE.Group();
    g.add(...children);
    return g;
  };

  // "IA" monogram: a slab-serif I and an A built from slanted bars.
  const depth = 0.5;
  const monogram = group(
    box(0.42, 2.0, depth, -0.95, 0),
    box(1.0, 0.36, depth, -0.95, 0.82),
    box(1.0, 0.36, depth, -0.95, -0.82),
    box(0.42, 2.12, depth, 0.42, 0, 0, -0.29),
    box(0.42, 2.12, depth, 1.0, 0, 0, 0.29),
    box(0.78, 0.3, depth, 0.71, -0.32),
  );

  const coin = (y: number, tilt: number, x = 0) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.22, 48), solid);
    mesh.position.set(x, y, 0);
    mesh.rotation.z = tilt;
    return mesh;
  };
  const solvent = group(coin(-0.75, 0), coin(-0.48, 0.02, 0.06), coin(-0.2, -0.03, -0.05), coin(0.1, 0.04, 0.04));
  const standing = coin(0.95, 0, 0);
  standing.rotation.set(Math.PI / 2, 0, 0.35);
  solvent.add(standing);
  solvent.rotation.x = 0.35;

  const seam = (rx: number, ry: number) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(1.21, 0.035, 8, 64), dark);
    mesh.rotation.set(rx, ry, 0);
    return mesh;
  };
  const advantage = group(
    new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 32), solid),
    seam(0, 0),
    seam(Math.PI / 2, 0),
    seam(0, Math.PI / 2.6),
    seam(0, -Math.PI / 2.6),
  );

  const pan = (x: number, y: number) => {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.16, 32), solid);
    dish.position.set(x, y, 0);
    return group(dish, box(0.04, 0.7, 0.04, x, y + 0.4));
  };
  const beam = group(box(2.6, 0.1, 0.16, 0, 0.95), pan(-1.2, 0.2), pan(1.2, 0.2));
  beam.rotation.z = 0.12;
  const juryrig = group(
    box(0.14, 2.2, 0.14, 0, -0.1),
    box(1.1, 0.16, 0.6, 0, -1.2),
    new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), solid).translateY(1.02),
    beam,
  );

  const kelly = group(new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.27, 160, 24), solid));

  const bars = [0.5, 0.9, 0.7, 1.4, 1.9].map((h, i) => box(0.36, h, 0.6, -1 + i * 0.5, -0.95 + h / 2, 0, 0, flat));
  const ratings = group(...bars, box(2.7, 0.08, 0.8, 0, -0.99));

  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), flat);
  diamond.scale.set(0.8, 1.35, 0.8);
  const sentry = group(diamond);

  const training = group(new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), flat));
  training.rotation.x = 0.3;

  return { monogram, solvent, advantage, juryrig, kelly, ratings, sentry, training } as Record<ModelKey, THREE.Group>;
}

export interface AsciiScene {
  swap(key: ModelKey): void;
  setSide(side: Side): void;
  setActive(active: boolean): void;
  dispose(): void;
}

export function initScene(canvas: HTMLCanvasElement, onStats: (text: string) => void): AsciiScene | null {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 7);

  // One hard key light, a whisper of fill so shadow sides keep a glyph.
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-3, 4, 5);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.12));

  const models = buildModels();
  const stage = new THREE.Group();
  const spinner = new THREE.Group();
  stage.add(spinner);
  scene.add(stage);
  let current: ModelKey = 'monogram';
  for (const [name, model] of Object.entries(models)) {
    model.visible = name === current;
    spinner.add(model);
  }

  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
  });
  const pass = new AsciiPass(createGlyphAtlas(), COLOURS);

  let width = 1;
  let height = 1;
  let ratio = 1;
  let cells = { x: 1, y: 1 };
  let side: Side = 'hero';
  const offset = { x: 0, y: 0, scale: 1 };

  const placement = (s: Side) => {
    const mobile = width < MOBILE;
    const viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewW = viewH * camera.aspect;
    if (mobile) return { x: 0, y: s === 'hero' ? viewH * 0.2 : 0, scale: Math.min(1, viewW / 3.4) * 0.92 };
    const fit = Math.min(1, (viewW * 0.38) / 3);
    return { x: s === 'hero' ? -viewW * 0.27 : viewW * 0.27, y: 0, scale: s === 'hero' ? fit * 1.05 : fit * 0.9 };
  };

  const resize = () => {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const cellPx = (width < MOBILE ? 10 : 8) * ratio;
    cells = { x: Math.ceil((width * ratio) / cellPx), y: Math.ceil((height * ratio) / cellPx) };
    target.setSize(cells.x, cells.y);
    pass.uniforms.uCell.value = cellPx;
    pass.uniforms.uCells.value.set(cells.x, cells.y);
    pass.uniforms.uRadius.value = 120 * ratio;
    Object.assign(offset, placement(side));
    draw();
  };

  const pointer = { yaw: 0, targetYaw: 0 };
  const onPointer = (event: PointerEvent) => {
    pass.uniforms.uMouse.value.set(event.clientX * ratio, (height - event.clientY) * ratio);
    pointer.targetYaw = (event.clientX / width - 0.5) * 0.8;
    if (reduced) draw();
  };
  const listeners = new AbortController();
  const { signal } = listeners;
  window.addEventListener('pointermove', onPointer, { passive: true, signal });
  window.addEventListener('pointerdown', onPointer, { passive: true, signal });
  window.addEventListener('resize', resize, { signal });

  let spin = reduced ? 0.6 : 0;
  function draw() {
    stage.position.set(offset.x, offset.y, 0);
    stage.scale.setScalar(offset.scale);
    spinner.rotation.y = spin + pointer.yaw;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    pass.render(renderer, target.texture);
  }

  let active = true;
  let raf = 0;
  let last = performance.now();
  let frames = 0;
  let fpsStamp = last;
  const status = (fps: number | string) => onStats(`fps ${fps} · cells ${cells.x}x${cells.y} · glyphs ${RAMP.length}`);

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    spin += 0.3 * dt;
    pointer.yaw += (pointer.targetYaw - pointer.yaw) * 0.08;
    pass.uniforms.uTick.value = Math.floor(now / 60);
    draw();
    frames++;
    if (now - fpsStamp >= 500) {
      status(Math.round((frames * 1000) / (now - fpsStamp)));
      frames = 0;
      fpsStamp = now;
    }
  };

  const sync = () => {
    cancelAnimationFrame(raf);
    if (reduced) {
      draw();
      status('static');
      return;
    }
    if (active && !document.hidden) {
      last = fpsStamp = performance.now();
      frames = 0;
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener('visibilitychange', sync, { signal });

  resize();
  sync();
  // The atlas is drawn with the webfont once it is ready.
  let disposed = false;
  document.fonts?.load('600 48px "IBM Plex Mono"').then(() => {
    if (disposed) return;
    pass.uniforms.tAtlas.value.dispose();
    pass.uniforms.tAtlas.value = createGlyphAtlas();
    if (reduced) draw();
  });

  const show = (name: ModelKey) => {
    models[current].visible = false;
    models[name].visible = true;
    current = name;
  };

  let swapTween: gsap.core.Timeline | null = null;
  return {
    swap(name) {
      if (name === current && !swapTween) return;
      swapTween?.kill();
      swapTween = null;
      if (reduced) {
        show(name);
        draw();
        return;
      }
      // 400ms glyph scramble: cells cycle random glyphs, the model changes at the peak.
      const scramble = pass.uniforms.uScramble;
      swapTween = gsap
        .timeline({ onComplete: () => (swapTween = null) })
        .to(scramble, { value: 1, duration: 0.2, ease: 'power2.in' })
        .call(() => show(name))
        .to(scramble, { value: 0, duration: 0.2, ease: 'power2.out' });
    },
    setSide(next) {
      if (next === side) return;
      side = next;
      const to = placement(side);
      if (reduced) {
        Object.assign(offset, to);
        draw();
      } else {
        gsap.to(offset, { ...to, duration: 0.9, ease: 'power3.inOut', overwrite: true });
      }
    },
    setActive(next) {
      if (next === active) return;
      active = next;
      sync();
    },
    dispose() {
      disposed = true;
      listeners.abort();
      cancelAnimationFrame(raf);
      swapTween?.kill();
      gsap.killTweensOf(offset);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      target.dispose();
      pass.dispose();
      renderer.dispose();
    },
  };
}
