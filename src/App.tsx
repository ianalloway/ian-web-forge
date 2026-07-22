import { Suspense, lazy } from "react";

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="font-mono text-primary text-lg animate-pulse">{'> loading...'}</div>
  </div>
);
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import SEO from "./components/SEO";
import Index from "./pages/Index";

const Now = lazy(() => import("./pages/Now"));
const HireMe = lazy(() => import("./pages/HireMe"));
const Toolkit = lazy(() => import("./pages/Toolkit"));
const Demos = lazy(() => import("./pages/Demos"));
const Bots = lazy(() => import("./pages/Bots"));
const Kelly = lazy(() => import("./pages/Kelly"));
const Dla = lazy(() => import("./pages/Dla"));
const Lorenz = lazy(() => import("./pages/Lorenz"));
const Gravity = lazy(() => import("./pages/Gravity"));
const Ascii = lazy(() => import("./pages/Ascii"));
const Type = lazy(() => import("./pages/Type"));
const Sort = lazy(() => import("./pages/Sort"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SEO />
                <Index />
              </>
            }
          />
          <Route
            path="/now"
            element={
              <>
                <SEO title="Now" path="/now" />
                <Now />
              </>
            }
          />
          <Route
            path="/hireme"
            element={
              <>
                <SEO title="Hire Me" path="/hireme" />
                <HireMe />
              </>
            }
          />
          <Route
            path="/toolkit"
            element={
              <>
                <SEO
                  title="Toolkit — Sports analytics & OSS"
                  path="/toolkit"
                  description="Public index of Ian Alloway’s sports ML stack, odds utilities, reporting tools, and GitHub repos — solvent-agent, ai-advantage, nba-ratings, kelly-js, juryrig, and more."
                />
                <Toolkit />
              </>
            }
          />
          <Route
            path="/demos"
            element={
              <>
                <SEO
                  title="Live Demos — SOLVENT, kelly-js, sports ML"
                  path="/demos"
                  description="Working product demos: SOLVENT self-funding agent, kelly-js calculator, nba-edge Streamlit, sports-betting-ml, and AI Advantage."
                />
                <Demos />
              </>
            }
          />
          <Route
            path="/bots"
            element={
              <>
                <SEO
                  title="How to Start the Bots — SOLVENT, juryrig, OpenClaw skills"
                  path="/bots"
                  description="Copy-paste commands to run SOLVENT, juryrig, and OpenClaw agent skills locally. No API keys needed for the SOLVENT demo."
                />
                <Bots />
              </>
            }
          />
          <Route
            path="/kelly"
            element={
              <>
                <SEO
                  title="Kelly Criterion Calculator — optimal bet sizing"
                  path="/kelly"
                  description="Interactive Kelly Criterion calculator: enter win probability, decimal odds, and bankroll to get optimal bet size, expected value, and full / half / quarter Kelly stakes. Powered by kelly-js."
                />
                <Kelly />
              </>
            }
          />
          <Route
            path="/dla"
            element={
              <>
                <SEO
                  title="Diffusion-Limited Aggregation — grow fractal crystals"
                  path="/dla"
                  description="Random-walking particles freeze on contact to grow dendritic fractals — the process behind frost, coral, mineral deposits, and lightning. Seed from a center or a floor."
                />
                <Dla />
              </>
            }
          />
          <Route
            path="/lorenz"
            element={
              <>
                <SEO
                  title="Lorenz Attractor — the butterfly of chaos"
                  path="/lorenz"
                  description="Integrate the Lorenz equations with RK4 and watch three trajectories starting 0.001 apart trace the butterfly yet diverge — deterministic chaos in a rotating 3D orbit."
                />
                <Lorenz />
              </>
            }
          />
          <Route
            path="/gravity"
            element={
              <>
                <SEO
                  title="Gravity Sandbox — N-body simulator"
                  path="/gravity"
                  description="Interactive N-body gravity sandbox: launch bodies, watch orbits form, and simulate binary stars, solar systems, and figure-8 choreographies."
                />
                <Gravity />
              </>
            }
          />
          <Route
            path="/ascii"
            element={
              <>
                <SEO
                  title="ASCII Art Generator"
                  path="/ascii"
                  description="Type text and watch it rendered as ASCII art in real time. Multiple character sets: classic ASCII, Unicode blocks, matrix glyphs, and binary."
                />
                <Ascii />
              </>
            }
          />
          <Route
            path="/type"
            element={
              <>
                <SEO
                  title="Typing Speed Test — WPM & accuracy"
                  path="/type"
                  description="Measure your typing speed and accuracy with tech and programming quotes. Get instant WPM, accuracy, and time results."
                />
                <Type />
              </>
            }
          />
          <Route
            path="/sort"
            element={
              <>
                <SEO
                  title="Sorting Algorithm Visualizer"
                  path="/sort"
                  description="Watch bubble, insertion, selection, quick, and merge sort race through a bar chart in real time. Adjustable speed, step counter, and color-coded comparisons."
                />
                <Sort />
              </>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route
            path="*"
            element={
              <>
                <SEO title="Page not found" path="" />
                <NotFound />
              </>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
