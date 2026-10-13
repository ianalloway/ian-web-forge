import * as THREE from 'three';
import { ATLAS_COLUMNS } from './atlas';

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D tScene;
  uniform sampler2D tAtlas;
  uniform vec2 uCells;
  uniform float uCell;
  uniform vec2 uMouse;
  uniform float uRadius;
  uniform float uTick;
  uniform float uScramble;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform vec3 uBackground;

  float lumAt(vec2 c) {
    vec3 src = texture2D(tScene, (c + 0.5) / uCells).rgb;
    return dot(src, vec3(0.299, 0.587, 0.114));
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 cell = floor(gl_FragCoord.xy / uCell);
    vec2 f = fract(gl_FragCoord.xy / uCell);
    float lum = lumAt(cell);

    float tl = lumAt(cell + vec2(-1.0, 1.0));
    float tc = lumAt(cell + vec2(0.0, 1.0));
    float tr = lumAt(cell + vec2(1.0, 1.0));
    float ml = lumAt(cell + vec2(-1.0, 0.0));
    float mr = lumAt(cell + vec2(1.0, 0.0));
    float bl = lumAt(cell + vec2(-1.0, -1.0));
    float bc = lumAt(cell + vec2(0.0, -1.0));
    float br = lumAt(cell + vec2(1.0, -1.0));
    float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
    float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
    float edge = length(vec2(gx, gy));

    float index;
    if (edge > 0.35) {
      // The edge runs perpendicular to the gradient: | \\ - /
      float q = mod(floor(atan(gy, gx) / 3.14159265 * 4.0 + 0.5), 4.0);
      index = 10.0 + q;
    } else {
      index = floor(clamp(lum, 0.0, 1.0) * 9.99);
    }

    bool content = lum > 0.02 || edge > 0.35;
    vec3 colour = uColor;
    float gain = 1.0;

    if (content && hash(cell * 1.7 + 3.1) < uScramble) {
      index = 1.0 + floor(hash(cell + uTick) * 15.0);
    }

    float d = distance((cell + 0.5) * uCell, uMouse);
    if (d < uRadius) {
      if (content) {
        colour = uAccent;
        index = 1.0 + floor(hash(cell + uTick * 1.31) * 15.0);
      } else if (hash(cell + uTick * 0.77) > 0.82) {
        colour = uAccent;
        index = 1.0 + floor(hash(cell.yx + uTick) * 3.0);
        gain = 0.45 * (1.0 - d / uRadius);
      }
    }

    vec2 uv = vec2((index + f.x * 0.9 + 0.05) / ${ATLAS_COLUMNS.toFixed(1)}, f.y);
    float glyph = texture2D(tAtlas, uv).r * gain;
    gl_FragColor = vec4(mix(uBackground, colour, glyph), 1.0);
  }
`;

const rgb = (hex: number) => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

/** Full-screen pass that turns a low-resolution scene render into shape-aware ASCII. */
export class AsciiPass {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  material: THREE.ShaderMaterial;

  constructor(atlas: THREE.Texture, colours: { text: number; accent: number; background: number }) {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: null },
        tAtlas: { value: atlas },
        uCells: { value: new THREE.Vector2(1, 1) },
        uCell: { value: 8 },
        uMouse: { value: new THREE.Vector2(-9999, -9999) },
        uRadius: { value: 120 },
        uTick: { value: 0 },
        uScramble: { value: 0 },
        uColor: { value: rgb(colours.text) },
        uAccent: { value: rgb(colours.accent) },
        uBackground: { value: rgb(colours.background) },
      },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  get uniforms() {
    return this.material.uniforms;
  }

  dispose() {
    this.uniforms.tAtlas.value?.dispose();
    this.material.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
  }

  render(renderer: THREE.WebGLRenderer, source: THREE.Texture) {
    this.uniforms.tScene.value = source;
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }
}
