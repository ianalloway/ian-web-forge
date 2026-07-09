interface SubscribeInput {
  email: string;
  name?: string;
}

interface SubscribeResult {
  success: boolean;
  message: string;
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
  const name = input.name?.trim();

  if (!email || !email.includes("@")) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  try {
    const payload = new URLSearchParams();
    payload.append("form-name", "ianalloway-newsletter");
    payload.append("email", email);
    if (name) payload.append("name", name);

    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Unable to save your signup. Please try again.",
      };
    }

    return {
      success: true,
      message: "You're on the list — I'll email new posts to " + email + ".",
    };
  } catch {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
