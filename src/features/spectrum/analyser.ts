export interface MicAnalyser {
  ctx: AudioContext;
  analyser: AnalyserNode;
  stream: MediaStream;
  freq: Uint8Array; // frequency-domain magnitudes (0-255)
  time: Uint8Array; // time-domain samples (0-255, 128 = zero)
}

/**
 * Request mic access and build an AnalyserNode. Throws if permission is
 * denied or getUserMedia is unavailable — the page handles the error.
 */
export async function startMic(fftSize = 2048): Promise<MicAnalyser> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not available in this browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0.7;
  source.connect(analyser);
  return {
    ctx,
    analyser,
    stream,
    freq: new Uint8Array(analyser.frequencyBinCount),
    time: new Uint8Array(analyser.fftSize),
  };
}

export function stopMic(mic: MicAnalyser): void {
  mic.stream.getTracks().forEach((t) => t.stop());
  mic.ctx.close().catch(() => {});
}

/** Map a magnitude 0-255 to a green-scale heat color (matrix palette). */
export function heatColor(v: number): [number, number, number] {
  const t = v / 255;
  // low -> dark, mid -> green, high -> white-green
  const g = Math.min(255, t * 340);
  const r = Math.max(0, (t - 0.7) / 0.3) * 200;
  const b = Math.max(0, (t - 0.55)) * 120;
  return [r + g * 0.13, g, b + g * 0.35];
}

/** Peak frequency bin -> approximate Hz, given sample rate and bin count. */
export function peakHz(freq: Uint8Array, sampleRate: number, binCount: number): number {
  let peak = 0;
  let peakVal = 0;
  for (let i = 1; i < freq.length; i++) {
    if (freq[i] > peakVal) { peakVal = freq[i]; peak = i; }
  }
  if (peakVal < 20) return 0; // effectively silence
  return (peak * sampleRate) / (2 * binCount);
}
