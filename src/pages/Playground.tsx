import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bomb,
  Gamepad2,
  Hash,
  Keyboard,
  Layers,
  Sparkles,
  Terminal,
  Type,
  type LucideIcon,
} from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  PLAYGROUND_ITEMS,
  TAG_LABELS,
  type PlaygroundIcon,
} from "@/features/playground/catalog";

const ICONS: Record<PlaygroundIcon, LucideIcon> = {
  terminal: Terminal,
  bomb: Bomb,
  hash: Hash,
  keyboard: Keyboard,
  sparkles: Sparkles,
  gamepad: Gamepad2,
  layers: Layers,
  type: Type,
};

export default function Playground() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2" />
              Back home
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/playground</p>
        </div>

        <header className="mb-8">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            PLAYGROUND
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-3">
            Browser toys
          </h1>
          <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-mono leading-relaxed">
            Self-contained interactive bits that run entirely client-side — no backend, just code in
            your browser. Each one is built the same way: pure logic, a thin matrix-styled view, and
            its own lazy-loaded route.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          {PLAYGROUND_ITEMS.map((item) => {
            const Icon = ICONS[item.iconKey];
            return (
              <Link
                key={item.path}
                to={item.path}
                className="group rounded-xl border border-primary/30 bg-card/55 backdrop-blur-sm p-5 hover:border-primary/60 transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={18} className="text-primary shrink-0" />
                    <span className="font-mono font-bold text-primary truncate">{item.title}</span>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider font-mono text-primary/70 border border-primary/30 rounded px-2 py-0.5">
                    {TAG_LABELS[item.tag]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">{item.blurb}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-xs font-mono text-primary/80 group-hover:text-primary">
                  Open {item.path}
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <footer className="mt-10 text-center text-xs font-mono text-muted-foreground">
          <Link to="/demos" className="text-primary/70 hover:text-primary">
            ← back to live demos
          </Link>
        </footer>
      </main>
    </div>
  );
}
