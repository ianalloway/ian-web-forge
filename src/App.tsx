import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import SEO from "./components/SEO";
import Index from "./pages/Index";

const queryClient = new QueryClient();
const Now = lazy(() => import("./pages/Now"));
const HireMe = lazy(() => import("./pages/HireMe"));
const Toolkit = lazy(() => import("./pages/Toolkit"));
const Snake = lazy(() => import("./pages/Snake"));
const RecoveryTracker = lazy(() => import("./pages/RecoveryTracker"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={null}>
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
                      description="Public index of Ian Alloway’s sports ML stack, odds utilities, reporting tools, and GitHub repos — nba-clv-dashboard, nba-ratings, odds-drift-watch, closing-line-archive, kelly-js, and more."
                    />
                    <Toolkit />
                  </>
                }
              />
              <Route
                path="/snake"
                element={
                  <>
                    <SEO
                      title="Snake"
                      path="/snake"
                      description="Play a classic Snake game on Ian Alloway's site: keyboard controls, score tracking, food spawn, restart, and mobile-friendly controls."
                    />
                    <Snake />
                  </>
                }
              />
              <Route
                path="/recovery"
                element={
                  <>
                    <SEO
                      title="Ankle Surgery Recovery Tracker"
                      path="/recovery"
                      description="Track post-ankle surgery pain, incision notes, range-of-motion exercises, physical therapy goals, symptoms to discuss with a surgeon, and appointment questions."
                    />
                    <RecoveryTracker />
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
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
