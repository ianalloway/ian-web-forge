import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="terminal-border rounded-lg bg-card/80 p-8 text-center">
        <p className="text-primary/70 font-mono text-sm mb-2">ROUTE_NOT_FOUND</p>
        <h1 className="text-4xl font-bold mb-4 font-mono text-primary">404</h1>
        <p className="text-muted-foreground mb-6 font-mono">That page does not exist.</p>
        <Link to="/" className="text-primary hover:text-primary/70 underline font-mono">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
