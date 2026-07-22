export type CharSet = "ascii" | "blocks" | "matrix" | "binary";

export const CHAR_SETS: Record<CharSet, { label: string; chars: string }> = {
  ascii:  { label: "ASCII",   chars: " .:-=+*#%@" },
  blocks: { label: "Blocks",  chars: " ░▒▓█" },
  matrix: { label: "Matrix",  chars: " .:;|01ｦｱﾎ#" },
  binary: { label: "Binary",  chars: " .0|1#█" },
};

export interface RenderOptions {
  cols: number;
  charSet: CharSet;
  fontSize: number;
  inverted: boolean;
}

export function textToAscii(text: string, opts: RenderOptions): string {
  if (!text.trim()) return "";

  const { cols, charSet, fontSize, inverted } = opts;
  const chars = CHAR_SETS[charSet].chars;

  // Off-screen canvas — sample at 2:1 aspect to compensate for char height
  const SAMPLE_W = 2; // pixels per col sample
  const SAMPLE_H = 4; // pixels per row sample (chars are ~2:1 tall)
  const W = cols * SAMPLE_W;
  const H = Math.ceil(fontSize * 1.5);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2, W - 4);

  const imageData = ctx.getImageData(0, 0, W, H);
  const rows = Math.floor(H / SAMPLE_H);

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      // Average brightness over the sample region
      let total = 0;
      let count = 0;
      for (let dy = 0; dy < SAMPLE_H; dy++) {
        for (let dx = 0; dx < SAMPLE_W; dx++) {
          const px = c * SAMPLE_W + dx;
          const py = r * SAMPLE_H + dy;
          if (px < W && py < H) {
            const idx = (py * W + px) * 4;
            total += imageData.data[idx]; // r channel (white = 255)
            count++;
          }
        }
      }
      const brightness = count > 0 ? total / count / 255 : 0;
      const t = inverted ? 1 - brightness : brightness;
      const charIdx = Math.round(t * (chars.length - 1));
      line += chars[charIdx];
    }
    lines.push(line);
  }

  // Trim blank rows top/bottom, then trim trailing spaces per line
  let start = 0;
  while (start < lines.length && lines[start].trim() === "") start++;
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === "") end--;

  return lines
    .slice(start, end + 1)
    .map((l) => l.trimEnd())
    .join("\n");
}
