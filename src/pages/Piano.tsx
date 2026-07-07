import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Music } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  BLACK_H,
  BLACK_W,
  KEY_MAP,
  NOTES,
  NUM_WHITE,
  PianoSynth,
  WHITE_H,
  WHITE_W,
  type NoteSpec,
  type Waveform,
} from "@/features/piano/synth";

const WAVEFORMS: Waveform[] = ["sine", "triangle", "square", "sawtooth"];

const PIANO_W = NUM_WHITE * WHITE_W;

function getBlackLeft(note: NoteSpec) {
  return (note.idx + 1) * WHITE_W - BLACK_W / 2;
}

export default function Piano() {
  const synthRef = useRef<PianoSynth | null>(null);
  const waveformRef = useRef<Waveform>("sine");
  const volumeRef = useRef(0.7);

  const [pressed, setPressed] = useState(new Set<string>());
  const [waveform, setWaveform] = useState<Waveform>("sine");
  const [volume, setVolume] = useState(0.7);
  const [lastNote, setLastNote] = useState<string | null>(null);

  useEffect(() => {
    synthRef.current = new PianoSynth();
    return () => {
      synthRef.current?.destroy();
      synthRef.current = null;
    };
  }, []);

  const noteOn = useCallback((note: NoteSpec) => {
    synthRef.current?.noteOn(note.label, note.freq, waveformRef.current);
    setPressed((prev) => new Set([...prev, note.label]));
    setLastNote(note.label);
  }, []);

  const noteOff = useCallback((note: NoteSpec) => {
    synthRef.current?.noteOff(note.label);
    setPressed((prev) => {
      const next = new Set(prev);
      next.delete(note.label);
      return next;
    });
  }, []);

  // Keyboard bindings
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = KEY_MAP[e.key.toLowerCase()];
      if (!note) return;
      noteOn(note);
    };
    const up = (e: KeyboardEvent) => {
      const note = KEY_MAP[e.key.toLowerCase()];
      if (!note) return;
      noteOff(note);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [noteOn, noteOff]);

  const handleWaveform = useCallback((w: Waveform) => {
    waveformRef.current = w;
    setWaveform(w);
    synthRef.current?.allNotesOff();
    setPressed(new Set());
  }, []);

  const handleVolume = useCallback((v: number) => {
    volumeRef.current = v;
    setVolume(v);
    synthRef.current?.setVolume(v);
  }, []);

  const whiteNotes = NOTES.filter((n) => !n.isBlack);
  const blackNotes = NOTES.filter((n) => n.isBlack);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="font-mono terminal-border text-primary border-primary"
            asChild
          >
            <Link to="/playground">
              <ArrowLeft className="mr-2" />
              Playground
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/piano</p>
        </div>

        <header className="mb-6">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            TOOL
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
            Piano Synthesizer
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Two octaves (C3–B4). Play with keyboard keys or click the keys. Web Audio synthesis.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-primary/70 mr-1">wave</span>
            {WAVEFORMS.map((w) => (
              <button
                key={w}
                onClick={() => handleWaveform(w)}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                  w === waveform
                    ? "border-primary text-primary"
                    : "border-primary/30 text-primary/50 hover:border-primary/60 hover:text-primary/70"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-mono text-primary/70">vol</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
              className="w-24 accent-[#00ff41]"
            />
            <span className="text-xs font-mono text-primary/70 w-6 text-right">
              {Math.round(volume * 100)}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-3 h-5 flex items-center gap-2 text-xs font-mono text-muted-foreground">
          {lastNote ? (
            <span className="text-primary/70">
              <span className="text-primary">{lastNote}</span>
              {pressed.size > 1 && <span className="ml-2 text-primary/40">+{pressed.size - 1} more</span>}
            </span>
          ) : (
            <span>press a key or click a piano key</span>
          )}
        </div>

        {/* Piano */}
        <div
          className="rounded-xl border border-primary/40 bg-card/30 backdrop-blur-sm overflow-x-auto"
          style={{ padding: "16px" }}
        >
          <div
            style={{
              position: "relative",
              width: PIANO_W,
              height: WHITE_H + 8,
              margin: "0 auto",
            }}
          >
            {/* White keys */}
            {whiteNotes.map((note) => {
              const isDown = pressed.has(note.label);
              return (
                <div
                  key={note.label}
                  onMouseDown={() => noteOn(note)}
                  onMouseUp={() => noteOff(note)}
                  onMouseLeave={() => { if (pressed.has(note.label)) noteOff(note); }}
                  onTouchStart={(e) => { e.preventDefault(); noteOn(note); }}
                  onTouchEnd={(e) => { e.preventDefault(); noteOff(note); }}
                  style={{
                    position: "absolute",
                    left: note.idx * WHITE_W,
                    top: 0,
                    width: WHITE_W - 1,
                    height: WHITE_H,
                    background: isDown
                      ? "rgba(0,255,65,0.25)"
                      : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(0,255,65,0.5)",
                    borderRadius: "0 0 4px 4px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingBottom: 6,
                    userSelect: "none",
                    transition: "background 60ms",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: isDown ? "#00ff41" : "rgba(0,255,65,0.4)", lineHeight: 1 }}>
                    {note.label}
                  </span>
                  <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(0,255,65,0.25)", lineHeight: 1, marginTop: 2 }}>
                    {note.key}
                  </span>
                </div>
              );
            })}

            {/* Black keys */}
            {blackNotes.map((note) => {
              const isDown = pressed.has(note.label);
              return (
                <div
                  key={note.label}
                  onMouseDown={(e) => { e.stopPropagation(); noteOn(note); }}
                  onMouseUp={(e) => { e.stopPropagation(); noteOff(note); }}
                  onMouseLeave={() => { if (pressed.has(note.label)) noteOff(note); }}
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); noteOn(note); }}
                  onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); noteOff(note); }}
                  style={{
                    position: "absolute",
                    left: getBlackLeft(note),
                    top: 0,
                    width: BLACK_W,
                    height: BLACK_H,
                    background: isDown
                      ? "rgba(0,255,65,0.45)"
                      : "rgba(0,10,0,0.92)",
                    border: "1px solid rgba(0,255,65,0.6)",
                    borderRadius: "0 0 3px 3px",
                    cursor: "pointer",
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingBottom: 5,
                    userSelect: "none",
                    transition: "background 60ms",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontSize: 7, fontFamily: "monospace", color: isDown ? "#00ff41" : "rgba(0,255,65,0.5)", lineHeight: 1 }}>
                    {note.key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard legend */}
        <div className="mt-5 grid sm:grid-cols-2 gap-3 text-xs font-mono text-muted-foreground">
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">lower octave (C3–B3)</span>
            <p className="mt-0.5 leading-relaxed">white keys: <span className="text-primary/70">z x c v b n m</span> · black: <span className="text-primary/70">s d g h j</span></p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">upper octave (C4–B4)</span>
            <p className="mt-0.5 leading-relaxed">white keys: <span className="text-primary/70">q w e r t y u</span> · black: <span className="text-primary/70">2 3 5 6 7</span></p>
          </div>
        </div>
      </main>
    </div>
  );
}
