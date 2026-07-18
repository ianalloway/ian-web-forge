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
const Pi = lazy(() => import("./pages/Pi"));
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
            path="/pi"
            element={
              <>
                <SEO
                  title="Monte Carlo π — estimate pi by throwing darts"
                  path="/pi"
                  description="Watch π emerge from random darts: uniform samples on a quarter circle, a live estimate, and a log-log convergence chart tracking the 1/√n error law."
                />
                <Pi />
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
