import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CipherId,
  CIPHERS,
  applyCipher,
  letterFrequency,
} from "../features/cipher/ciphers";

const CIPHER_KEYS = Object.keys(CIPHERS) as CipherId[];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Cipher() {
  const [cipher, setCipher] = useState<CipherId>("caesar");
  const [input, setInput] = useState("meet me at the usual place at midnight");
  const [shift, setShift] = useState(3);
  const [key, setKey] = useState("MATRIX");
  const [decode, setDecode] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => applyCipher(cipher, input, { shift, key, decode }),
    [cipher, input, shift, key, decode]
  );

  const freq = useMemo(() => letterFrequency(output), [output]);
  const maxFreq = Math.max(1, ...freq);

  const meta = CIPHERS[cipher];
  const showDecode = cipher === "caesar" || cipher === "vigenere";

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — user can select manually
    }
  };

  const handleSwap = () => {
    setInput(output);
    if (showDecode) setDecode((d) => !d);
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
          <span className="text-sm">cipher playground</span>
        </div>
        <div className="text-xs text-primary/40">{meta.note}</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {CIPHER_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => setCipher(id)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                cipher === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {CIPHERS[id].label}
            </button>
          ))}
        </div>

        {meta.needsShift && (
          <div className="flex items-center gap-2">
            <span className="text-primary/40 text-xs">shift</span>
            <input
              type="range"
              min={1}
              max={25}
              value={shift}
              onChange={(e) => setShift(Number(e.target.value))}
              className="w-24 accent-primary"
            />
            <span className="text-primary/60 text-xs w-6">{shift}</span>
          </div>
        )}

        {meta.needsKey && (
          <div className="flex items-center gap-2">
            <span className="text-primary/40 text-xs">key</span>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.slice(0, 24))}
              placeholder="KEYWORD"
              spellCheck={false}
              className="bg-transparent border border-primary/20 focus:border-primary/60 outline-none px-2 py-0.5 text-xs text-primary w-32 uppercase placeholder-primary/20"
            />
          </div>
        )}

        {showDecode && (
          <div className="flex gap-1">
            <button
              onClick={() => setDecode(false)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                !decode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50"
              }`}
            >
              encode
            </button>
            <button
              onClick={() => setDecode(true)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                decode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50"
              }`}
            >
              decode
            </button>
          </div>
        )}
      </div>

      {/* Panels */}
      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-primary/10" style={{ minHeight: 0 }}>
        {/* Input */}
        <div className="flex-1 flex flex-col bg-background p-4 gap-2">
          <div className="text-xs text-primary/40">
            {decode && showDecode ? "ciphertext in" : "plaintext in"}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 4000))}
            spellCheck={false}
            className="flex-1 min-h-40 bg-transparent border border-primary/20 focus:border-primary/50 outline-none resize-none p-3 text-sm text-primary leading-relaxed placeholder-primary/20"
            placeholder="type or paste text..."
          />
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col bg-background p-4 gap-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-primary/40">
              {decode && showDecode ? "plaintext out" : "ciphertext out"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSwap}
                title="use output as input (flips encode/decode)"
                className="px-2 py-0.5 text-xs border border-primary/20 hover:border-primary/60 text-primary/50 hover:text-primary transition-colors"
              >
                ⇄ swap
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className="px-2 py-0.5 text-xs border border-primary/20 hover:border-primary/60 text-primary/50 hover:text-primary transition-colors disabled:opacity-30"
              >
                {copied ? "✓ copied" : "copy"}
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-40 border border-primary/10 bg-primary/[0.02] p-3 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-auto select-all">
            {output || <span className="text-primary/20">output appears here</span>}
          </div>
        </div>
      </div>

      {/* Frequency histogram */}
      <div className="border-t border-primary/10 px-4 py-3">
        <div className="text-xs text-primary/30 mb-2">output letter frequency</div>
        <div className="flex items-end gap-1 h-14">
          {ALPHABET.map((ch, i) => (
            <div key={ch} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className="w-full bg-primary/60"
                style={{ height: `${(freq[i] / maxFreq) * 40}px` }}
              />
              <span className="text-[9px] text-primary/30">{ch}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
