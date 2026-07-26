import { useState } from "react";
import {
  NEWSLETTER_FORM_ACTION,
  NEWSLETTER_FORM_NAME,
  NEWSLETTER_HONEYPOT,
  isValidEmail,
  subscribeToNewsletter,
} from "@/lib/newsletter";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  // Clear a stale result as soon as the visitor starts editing again, so an old
  // error never sits under a form they have already corrected.
  const clearResult = () => {
    if (status === "idle" || status === "sending") return;
    setStatus("idle");
    setMessage("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // The button is disabled while sending, but pressing Enter in an input
    // still fires submit — bail out so one signup can't be posted twice.
    if (status === "sending") return;

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage("");
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
      {/* name/method/action + form-name mirror the spacer in index.html so the
          form still posts to Netlify natively if this script never runs. */}
      <form
        name={NEWSLETTER_FORM_NAME}
        method="POST"
        action={NEWSLETTER_FORM_ACTION}
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="form-name" value={NEWSLETTER_FORM_NAME} />
        <p hidden>
          <label>
            Leave this field empty
            <input type="text" name={NEWSLETTER_HONEYPOT} tabIndex={-1} autoComplete="off" />
          </label>
        </p>
        <label>
          <span className="rd-mono">NAME / OPTIONAL</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Ian"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearResult();
            }}
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
            onChange={(event) => {
              setEmail(event.target.value);
              clearResult();
            }}
          />
        </label>
        <button type="submit" disabled={status === "sending"} className="rd-mono">
          {status === "sending" ? "Sending…" : "Subscribe ↗"}
        </button>
        {message && (
          <p
            className={`rd-newsletter-message ${status === "error" ? "is-error" : ""}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
