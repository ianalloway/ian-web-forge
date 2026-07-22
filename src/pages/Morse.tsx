import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  encode,
  decode,
  looksLikeMorse,
  MorsePlayer,
} from "../features/morse/morse";

export default function Morse() {
  const [input, setInput] = useState("hello world");
  const [wpm, setWpm] = useState(15);
  const [freq, setFreq] = useState(600);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const playerRef = useRef<MorsePlayer | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMorseInput = useMemo(() => looksLikeMorse(input), [input]);
  const output = useMemo(
    () => (isMorseInput ? decode(input) : encode(input)),
    [input, isMorseInput]
  );
  const morseToPlay = isMorseInput ? input : output;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      playerRef.current?.dispose();
    };
  }, []);

  const handlePlay = () => {
    if (playing) {
      playerRef.current?.stop();
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      setPlaying(false);
      return;
    }
    if (!morseToPlay.trim()) return;
    if (!playerRef.current) playerRef.current = new MorsePlayer();
    const duration = playerRef.current.play(morseToPlay, wpm, freq);
    setPlaying(true);
    stopTimerRef.current = setTimeout(() => setPlaying(false), duration * 1000);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">morse code</span>
        </div>
        <div className="text-xs text-primary/40">
          {isMorseInput ? "morse → text" : "text → morse"} · auto-detected
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={5}
            max={35}
            step={1}
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-12">{wpm} wpm</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">tone</span>
          <input
            type="range"
            min={400}
            max={1000}
            step={50}
            value={freq}
            onChange={(e) => setFreq(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-12">{freq} Hz</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handlePlay}
            disabled={!morseToPlay.trim()}
            className="px-3 py-1 text-xs border border-primary/50 bg-primary/10 hover:border-primary text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {playing ? "⏹ stop" : "▶ play"}
          </button>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30"
          >
            {copied ? "✓ copied" : "copy"}
          </button>
        </div>
      </div>

      {/* Panels */}
      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-primary/10" style={{ minHeight: 0 }}>
        <div className="flex-1 flex flex-col bg-background p-4 gap-2">
          <span className="text-xs text-primary/40">
            {isMorseInput ? "morse in" : "text in"}
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            spellCheck={false}
            placeholder="type text… or paste morse like .... ..
(auto-detects direction)"
            className="flex-1 min-h-40 bg-transparent border border-primary/20 focus:border-primary/50 outline-none resize-none p-3 text-sm text-primary leading-relaxed placeholder-primary/20"
          />
        </div>

        <div className="flex-1 flex flex-col bg-background p-4 gap-2">
          <span className="text-xs text-primary/40">
            {isMorseInput ? "text out" : "morse out"}
          </span>
          <div className="flex-1 min-h-40 border border-primary/10 bg-primary/[0.02] p-3 text-lg leading-loose tracking-wider whitespace-pre-wrap break-words overflow-auto select-all">
            {output || <span className="text-primary/20 text-sm">output appears here</span>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-primary/10 px-4 py-2 text-xs text-primary/30 text-center">
        dit = 1 unit · dah = 3 · letter gap 3 · word gap 7 — timing follows the PARIS standard (dit = 1.2s ÷ wpm)
      </div>
    </div>
  );
}
