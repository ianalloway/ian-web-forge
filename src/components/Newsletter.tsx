import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/newsletter";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    const result = await subscribeToNewsletter({ email, name });
    if (result.success) {
      setStatus("done");
      setMessage(result.message);
      setEmail("");
      setName("");
      return;
    }

    setStatus("error");
    setMessage(result.message);
  };

  return (
    <div className="rd-newsletter" data-reveal>
      <div>
        <span className="rd-mono">SUBSTACK / OCCASIONAL</span>
        <h3>Get the next field note.</h3>
        <p>No content calendar. I send something when it is worth sending.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          <span className="rd-mono">NAME / OPTIONAL</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Ian"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          <span className="rd-mono">EMAIL</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="submit" disabled={status === "sending"} className="rd-mono">
          {status === "sending" ? "Sending…" : "Subscribe ↗"}
        </button>
        {message && (
          <p className={`rd-newsletter-message ${status === "error" ? "is-error" : ""}`} role="status">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
