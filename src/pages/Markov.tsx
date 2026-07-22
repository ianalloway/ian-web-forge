import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildChain,
  generate,
  branchingFactor,
  SAMPLE_CORPUS,
} from "../features/markov/chain";

const MAX_CORPUS = 50000;

export default function Markov() {
  const [corpus, setCorpus] = useState(SAMPLE_CORPUS);
  const [order, setOrder] = useState(2);
  const [maxWords, setMaxWords] = useState(60);
  const [outputs, setOutputs] = useState<string[]>([]);

  const chain = useMemo(() => buildChain(corpus, order), [corpus, order]);
  const branching = useMemo(() => (chain ? branchingFactor(chain) : 0), [chain]);

  const handleGenerate = () => {
    if (!chain) return;
    const text = generate(chain, { maxWords, stopAtSentenceEnd: true });
    setOutputs((prev) => [text, ...prev].slice(0, 8));
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
          <span className="text-sm">markov text generator</span>
        </div>
        {chain && (
          <div className="text-xs text-primary/40 flex gap-4">
            <span>{chain.wordCount.toLocaleString()} words</span>
            <span>{chain.stateCount.toLocaleString()} states</span>
            <span>branching {branching.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">order</span>
          <input
            type="range"
            min={1}
            max={4}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4">{order}</span>
          <span className="text-primary/30 text-xs hidden sm:inline">
            {order === 1 ? "word salad" : order === 2 ? "loose remix" : order === 3 ? "coherent-ish" : "near-quotes"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">length</span>
          <input
            type="range"
            min={20}
            max={150}
            step={10}
            value={maxWords}
            onChange={(e) => setMaxWords(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8">{maxWords}w</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setCorpus(SAMPLE_CORPUS)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ sample corpus
          </button>
          <button
            onClick={handleGenerate}
            disabled={!chain}
            className="px-3 py-1 text-xs border border-primary/50 bg-primary/10 hover:border-primary text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶ generate
          </button>
        </div>
      </div>

      {/* Panels */}
      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-primary/10" style={{ minHeight: 0 }}>
        {/* Corpus input */}
        <div className="flex-1 flex flex-col bg-background p-4 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary/40">training corpus</span>
            <span className="text-xs text-primary/20">{corpus.length.toLocaleString()}/{MAX_CORPUS.toLocaleString()}</span>
          </div>
          <textarea
            value={corpus}
            onChange={(e) => setCorpus(e.target.value.slice(0, MAX_CORPUS))}
            spellCheck={false}
            placeholder="paste any text — song lyrics, a blog post, documentation..."
            className="flex-1 min-h-48 bg-transparent border border-primary/20 focus:border-primary/50 outline-none resize-none p-3 text-sm text-primary/90 leading-relaxed placeholder-primary/20"
          />
          {!chain && corpus.trim().length > 0 && (
            <div className="text-xs text-yellow-300">corpus too short for order {order} — add more text</div>
          )}
        </div>

        {/* Generated outputs */}
        <div className="flex-1 flex flex-col bg-background p-4 gap-2 overflow-auto">
          <span className="text-xs text-primary/40">generated ({outputs.length})</span>
          {outputs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-primary/20 text-sm">
              press generate
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {outputs.map((text, i) => (
                <div
                  key={`${i}-${text.slice(0, 20)}`}
                  className={`border p-3 text-sm leading-relaxed ${
                    i === 0
                      ? "border-primary/40 text-primary"
                      : "border-primary/10 text-primary/50"
                  }`}
                >
                  {text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-primary/10 px-4 py-2 text-xs text-primary/30 text-center">
        an order-n chain predicts each word from the previous n — the same math behind autocomplete, shrunk to a party trick
      </div>
    </div>
  );
}
