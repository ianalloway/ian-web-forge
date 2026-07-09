import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/newsletter";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    const res = await subscribeToNewsletter({ email, name });
    if (res.success) {
      setStatus("done");
      setMessage(res.message);
      setEmail("");
      setName("");
    } else {
      setStatus("error");
      setMessage(res.message);
    }
  };

  return (
    <div
      style={{
        marginTop: 28,
        padding: "22px 24px",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.012)",
      }}
    >
      <p style={{ fontSize: 14, color: "#cdd2c5", marginBottom: 14, fontWeight: 600 }}>
        Get new posts by email
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <input
          type="text"
          name="name"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            flex: "1 1 160px",
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.25)",
            color: "#f4f6f1",
            fontSize: 14,
          }}
        />
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flex: "2 1 220px",
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.25)",
            color: "#f4f6f1",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          style={{
            padding: "11px 20px",
            borderRadius: 8,
            border: "none",
            background: "#5be49b",
            color: "#0a0b0a",
            fontSize: 14,
            fontWeight: 600,
            cursor: status === "sending" ? "wait" : "pointer",
          }}
        >
          {status === "sending" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p
          style={{
            fontSize: 13,
            marginTop: 10,
            color: status === "error" ? "#ff9a9a" : "#9aa093",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Newsletter;
