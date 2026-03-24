import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import SEO from "./components/SEO";
import Index from "./pages/Index";
import Now from "./pages/Now";
import HireMe from "./pages/HireMe";
import Toolkit from "./pages/Toolkit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
                    description="Public index of Ian Alloway’s sports ML stack, odds utilities, MLOps tools, and GitHub repos — nba-clv-dashboard, nba-ratings, line-shop-cli, closing-line-archive, odds-drift-watch, and more."
                  />
                  <Toolkit />
                </>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
