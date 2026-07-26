interface SubscribeInput {
  email: string;
  name?: string;
}

interface SubscribeResult {
  success: boolean;
  message: string;
}

/** Must match the hidden spacer form declared in index.html. */
export const NEWSLETTER_FORM_NAME = "ianalloway-newsletter";

/** Netlify processes form POSTs at the spacer form's action path. */
export const NEWSLETTER_FORM_ACTION = "/";

/** Honeypot field name declared via `netlify-honeypot` on the spacer form. */
export const NEWSLETTER_HONEYPOT = "bot-field";

const SUBMIT_TIMEOUT_MS = 15_000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * Builds the urlencoded body Netlify Forms expects. Every field declared on the
 * spacer form has to be sent explicitly — anything omitted is stored blank, and
 * omitting the honeypot entirely makes Netlify's spam check unhappy.
 */
function buildPayload(email: string, name: string): URLSearchParams {
  const payload = new URLSearchParams();
  payload.append("form-name", NEWSLETTER_FORM_NAME);
  payload.append(NEWSLETTER_HONEYPOT, "");
  payload.append("email", email);
  payload.append("name", name);
  payload.append("source", "homepage-newsletter");

  if (typeof window !== "undefined") {
    payload.append("site", window.location.host);
    payload.append("page_url", window.location.href);
    payload.append("referrer", document.referrer);
    payload.append("user_agent", window.navigator.userAgent);
  }

  return payload;
}

/**
 * Submits the newsletter signup to the Netlify Forms "ianalloway-newsletter"
 * spacer declared in index.html. No backend required — Netlify captures the
 * submission and notifies via the site's configured email.
 */
export async function subscribeToNewsletter(
  input: SubscribeInput,
): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() ?? "";

  if (!isValidEmail(email)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetch(NEWSLETTER_FORM_ACTION, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildPayload(email, name).toString(),
      signal: controller.signal,
    });

    // The SPA rewrite (`/* -> /index.html 200`) answers any POST with the app
    // shell, so a 200 alone does not prove Netlify recorded anything. When the
    // form handler is absent — local dev, or a deploy where form detection
    // failed — the request 404/405s instead of being accepted.
    if (response.status === 404 || response.status === 405) {
      return {
        success: false,
        message: "Signups aren't available right now. Email ian@allowayllc.com instead.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: "Unable to save your signup. Please try again.",
      };
    }

    return {
      success: true,
      message: `You're on the list — I'll email new posts to ${email}.`,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        message: "That took too long. Please try again.",
      };
    }

    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
