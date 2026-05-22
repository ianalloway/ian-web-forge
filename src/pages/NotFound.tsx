import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-xs font-mono text-primary/70 mb-2">// ERROR_404</p>
        <h1 className="text-4xl font-bold font-mono text-primary mb-4">Page not found</h1>
        <p className="text-muted-foreground font-mono text-sm mb-6">
          No route for <span className="text-primary">{location.pathname}</span>
        </p>
        <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2" size={16} />
            Return home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
