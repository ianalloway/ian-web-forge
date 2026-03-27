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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
