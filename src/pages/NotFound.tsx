import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home, Briefcase, Wrench, Activity, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestedRoutes = [
  { path: "/", label: "~/home", description: "Portfolio, projects, and contact", icon: Home },
  { path: "/hireme", label: "~/hire", description: "Services, rates, and availability", icon: Briefcase },
  { path: "/toolkit", label: "~/toolkit", description: "Sports analytics and open-source tools", icon: Wrench },
  { path: "/bots", label: "~/bots", description: "How to start SOLVENT and other agents", icon: Bot },
  { path: "/now", label: "~/now", description: "What I'm focused on right now", icon: Activity },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs font-mono text-primary/70 mb-2">// ERROR_404</p>
          <h1 className="text-4xl font-bold font-mono text-primary mb-4">Page not found</h1>
          <p className="text-muted-foreground font-mono text-sm">
            No route for <span className="text-primary break-all">{location.pathname}</span>
          </p>
        </div>

        <div className="border border-border rounded-lg p-4 mb-8 bg-background/60">
          <p className="text-xs font-mono text-muted-foreground mb-3">$ ls ~/available-routes</p>
          <nav aria-label="Suggested pages">
            <ul className="space-y-1">
              {suggestedRoutes.map(({ path, label, description, icon: Icon }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="flex items-center gap-3 rounded-md px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary"
                  >
                    <Icon size={16} className="shrink-0 text-primary/70" aria-hidden="true" />
                    <span className="text-primary">{label}</span>
                    <span className="hidden sm:inline text-xs">— {description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="text-center">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2" size={16} />
              Return home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
