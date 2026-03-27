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
    const submission = new URLSearchParams({
      "form-name": "ianalloway-newsletter",
      email,
      name: name || "",
      site: input.site,
      source: input.source,
      page_url: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
    const response = await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: submission.toString(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Netlify could not save your signup. Please try again.",
      };
    }

    const redirectUrl = new URL(
      "/subscribe",
      import.meta.env.VITE_SUBSTACK_PUBLICATION_URL || "https://allowayai.substack.com",
    );
    redirectUrl.searchParams.set("utm_source", input.source);
    redirectUrl.searchParams.set("utm_medium", "website");
    redirectUrl.searchParams.set("utm_campaign", "newsletter");

    return {
      success: true,
      message: "Saved. We captured your signup and are taking you to the official Substack subscribe page.",
      redirectUrl: redirectUrl.toString(),
    };
  } catch {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
