interface SubscribeInput {
  email: string;
  name?: string;
  site: string;
  source: string;
}

interface SubscribeResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

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
    const response = await fetch("/api/newsletter-subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name: name || undefined,
        site: input.site,
        source: input.source,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      redirectUrl?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Unable to save your signup. Please try again.",
      };
    }

    return {
      success: true,
      message:
        data.message ||
        "Saved. We logged your signup and are taking you to the official Substack subscribe page.",
      redirectUrl: data.redirectUrl,
    };
  } catch {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
