import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { textToAscii, CHAR_SETS, CharSet } from "../features/ascii/renderer";

const CHAR_SET_KEYS = Object.keys(CHAR_SETS) as CharSet[];
const DEFAULT_COLS = 80;
const DEFAULT_FONT = 72;

export default function Ascii() {
  const [input, setInput] = useState("HELLO");
  const [charSet, setCharSet] = useState<CharSet>("ascii");
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [inverted, setInverted] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    return textToAscii(input, { cols, charSet, fontSize, inverted });
  }, [input, cols, charSet, fontSize, inverted]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: select the pre content
    }
  };

  const lineCount = output ? output.split("\n").length : 0;
  const charCount = output ? output.length : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">ascii art generator</span>
        </div>
        {output && (
          <div className="text-xs text-primary/40">
            {lineCount} rows · {charCount} chars
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-b border-primary/10 px-4 py-3 flex items-center gap-2">
        <span className="text-primary/40 text-sm select-none">›</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 40))}
          placeholder="type something..."
          maxLength={40}
          className="flex-1 bg-transparent outline-none text-primary placeholder-primary/20 text-sm tracking-wider"
          spellCheck={false}
          autoComplete="off"
        />
        <span className="text-primary/20 text-xs">{input.length}/40</span>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        {/* Char set */}
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">charset</span>
          <div className="flex gap-1">
            {CHAR_SET_KEYS.map((cs) => (
              <button
                key={cs}
                onClick={() => setCharSet(cs)}
                className={`px-2 py-0.5 text-xs border transition-colors ${
                  charSet === cs
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
                }`}
              >
                {CHAR_SETS[cs].label}
              </button>
            ))}
          </div>
        </div>

        {/* Cols */}
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">cols</span>
          <input
            type="range"
            min={40}
            max={140}
            step={5}
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-6">{cols}</span>
        </div>

        {/* Font size */}
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">size</span>
          <input
            type="range"
            min={36}
            max={120}
            step={4}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-6">{fontSize}</span>
        </div>

        {/* Invert */}
        <button
          onClick={() => setInverted((v) => !v)}
          className={`px-2 py-0.5 text-xs border transition-colors ${
            inverted
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/20 text-primary/40 hover:border-primary/50"
          }`}
        >
          invert
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          disabled={!output}
          className="ml-auto px-3 py-0.5 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-4" style={{ minHeight: 0 }}>
        {output ? (
          <pre
            className="text-primary leading-none select-all"
            style={{ fontSize: `${Math.max(6, Math.round(600 / cols))}px` }}
          >
            {output}
          </pre>
        ) : (
          <div className="h-full flex items-center justify-center text-primary/20 text-sm">
            start typing above
          </div>
        )}
      </div>
    </div>
  );
}
