import * as THREE from 'three';

// 10 brightness glyphs, 4 directional edge glyphs, 2 spares used by the scan/scramble.
export const RAMP = ' .:-=+*#%@';
export const GLYPHS = RAMP + '|\\-/$0';
export const ATLAS_COLUMNS = 16;
const CELL = 64;

/** Draws the 16-glyph atlas (one row, 64px cells) and returns it as a texture. */
export function createGlyphAtlas(fontFamily = '"IBM Plex Mono", ui-monospace, monospace') {
  const canvas = document.createElement('canvas');
  canvas.width = CELL * ATLAS_COLUMNS;
  canvas.height = CELL;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${CELL * 0.92}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < ATLAS_COLUMNS; i++) {
    ctx.fillText(GLYPHS[i], i * CELL + CELL / 2, CELL / 2 + CELL * 0.04);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}
