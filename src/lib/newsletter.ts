interface SubscribeInput {
  email: string;
  name?: string;
}

interface SubscribeResult {
  success: boolean;
  message: string;
}

/** Must match the spacer forms in index.html and public/__forms.html. */
export const NEWSLETTER_FORM_NAME = "ianalloway-newsletter";

/** Netlify processes form POSTs at the spacer form's action path. */
export const NEWSLETTER_FORM_ACTION = "/";

/**
 * Where the POST is attempted, in order. "/" is the historical target, but it
 * is covered by the SPA rewrite in netlify.toml, so a deploy whose form
 * detection did not pick up index.html answers with the app shell or a 404
 * rather than the form handler. public/__forms.html is a real file in the
 * publish directory: it is never rewritten, and it declares the same form.
 * Trying both means the signup lands whichever way Netlify wired detection.
 */
const SUBMIT_PATHS = [NEWSLETTER_FORM_ACTION, "/__forms.html"] as const;

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

/** A 404/405 means there is no Netlify form handler at that path. */
function isMissingHandler(status: number): boolean {
  return status === 404 || status === 405;
}

/**
 * Submits the newsletter signup to the Netlify Forms "ianalloway-newsletter"
 * spacer. No backend required — Netlify captures the submission and notifies
 * via the site's configured email.
 *
 * Tries each path in SUBMIT_PATHS until one is served by the form handler, so
 * the signup lands whether detection picked up index.html or __forms.html.
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
  const body = buildPayload(email, name).toString();

  try {
    let lastStatus = 0;

    for (const path of SUBMIT_PATHS) {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      });
      lastStatus = response.status;

      // Note: the SPA rewrite answers any POST to "/" with the app shell, so a
      // 200 is not by itself proof Netlify recorded the submission — only that
      // nothing rejected it. A missing handler does surface as 404/405, which
      // is what makes falling through to the next path worthwhile.
      if (isMissingHandler(response.status)) continue;

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
    }

    // Every candidate path 404/405'd — the form handler is not deployed at all.
    console.warn(
      `[newsletter] no Netlify form handler found (last status ${lastStatus}); ` +
        `tried ${SUBMIT_PATHS.join(", ")}`,
    );
    return {
      success: false,
      message: "Signups aren't available right now. Email ian@allowayllc.com instead.",
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
