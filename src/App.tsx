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
