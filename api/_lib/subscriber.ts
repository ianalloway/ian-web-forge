export class SubscriberValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriberValidationError";
  }
}

type SubscriberPayload = {
  email: string;
  name?: string;
  site?: string;
  source?: string;
  pageUrl?: string;
  referrer?: string;
  userAgent?: string;
};

type HeaderMap = Record<string, string | string[] | undefined>;

export interface NewsletterResult {
  message: string;
  redirectUrl: string;
}

const NOTION_VERSION = "2022-06-28";
const DEFAULT_SUBSTACK_URL = "https://allowayai.substack.com";
const MAX_EMAIL_LENGTH = 254;
const MAX_TEXT_LENGTH = 200;
const MAX_URL_LENGTH = 2048;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getHeader(headers: HeaderMap, name: string) {
  const directValue = headers[name] || headers[name.toLowerCase()];
  return Array.isArray(directValue) ? directValue[0] : directValue;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length > maxLength) {
    throw new SubscriberValidationError("Request fields are too long.");
  }

  return trimmed;
}

function normalizeUrl(value: unknown) {
  const text = normalizeText(value, MAX_URL_LENGTH);
  if (!text) {
    return undefined;
  }

  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new SubscriberValidationError("Invalid request URL.");
    }
  } catch {
    throw new SubscriberValidationError("Invalid request URL.");
  }

  return text;
}

export function parseSubscriberPayload(body: unknown, headers: HeaderMap): SubscriberPayload {
  let raw: Record<string, unknown>;
  if (typeof body === "string") {
    try {
      raw = JSON.parse(body) as Record<string, unknown>;
    } catch {
      throw new SubscriberValidationError("Invalid request body.");
    }
  } else if (body && typeof body === "object" && !Array.isArray(body)) {
    raw = body as Record<string, unknown>;
  } else {
    raw = {};
  }

  const email = normalizeText(raw.email, MAX_EMAIL_LENGTH)?.toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new SubscriberValidationError("Please enter a valid email address.");
  }

  return {
    email,
    name: normalizeText(raw.name),
    site: normalizeText(raw.site) || "unknown-site",
    source: normalizeText(raw.source) || "unknown-source",
    pageUrl: normalizeUrl(raw.pageUrl),
    referrer: normalizeUrl(raw.referrer),
    userAgent: normalizeText(raw.userAgent, 500) || getHeader(headers, "user-agent"),
  };
}

function buildNotionTitle(payload: SubscriberPayload) {
  const date = new Date().toISOString().slice(0, 10);
  const prefix = payload.site || "signup";
  return `${prefix} subscriber - ${payload.email} - ${date}`.slice(0, 100);
}

function buildSubstackRedirectUrl(source: string) {
  const publicationUrl = process.env.SUBSTACK_PUBLICATION_URL || DEFAULT_SUBSTACK_URL;
  const redirectUrl = new URL("/subscribe", publicationUrl);
  redirectUrl.searchParams.set("utm_source", source);
  redirectUrl.searchParams.set("utm_medium", "website");
  redirectUrl.searchParams.set("utm_campaign", "newsletter");
  return redirectUrl.toString();
}

async function createNotionSignupPage(payload: SubscriberPayload) {
  const notionApiKey = requireEnv("NOTION_API_KEY");
  const parentPageId = requireEnv("NOTION_PARENT_PAGE_ID");
  const subscribedAt = new Date().toISOString();
  const lines = [
    `Email: ${payload.email}`,
    `Name: ${payload.name || "Not provided"}`,
    `Site: ${payload.site || "Unknown"}`,
    `Source: ${payload.source || "Unknown"}`,
    `Subscribed at: ${subscribedAt}`,
    `Page URL: ${payload.pageUrl || "Not provided"}`,
    `Referrer: ${payload.referrer || "Direct / not provided"}`,
    `User agent: ${payload.userAgent || "Not provided"}`,
  ];

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionApiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: {
        page_id: parentPageId,
      },
      properties: {
        title: {
          title: [
            {
              type: "text",
              text: {
                content: buildNotionTitle(payload),
              },
            },
          ],
        },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: "Newsletter signup",
                },
              },
            ],
          },
        },
        ...lines.map((line) => ({
          object: "block" as const,
          type: "bulleted_list_item" as const,
          bulleted_list_item: {
            rich_text: [
              {
                type: "text" as const,
                text: {
                  content: line,
                },
              },
            ],
          },
        })),
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion write failed: ${errorText}`);
  }

  const data = (await response.json()) as { url?: string };
  return {
    subscribedAt,
    notionUrl: data.url,
  };
}

async function sendNotificationEmail(
  payload: SubscriberPayload,
  meta: { notionUrl?: string; subscribedAt: string },
) {
  const resendApiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");
  const notifyEmail = requireEnv("NOTIFY_EMAIL");
  const subject = `New newsletter signup from ${payload.site || "website"}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin-bottom:12px;">New newsletter signup</h2>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Name:</strong> ${escapeHtml(payload.name || "Not provided")}</p>
      <p><strong>Site:</strong> ${escapeHtml(payload.site || "Unknown")}</p>
      <p><strong>Source:</strong> ${escapeHtml(payload.source || "Unknown")}</p>
      <p><strong>Subscribed at:</strong> ${escapeHtml(meta.subscribedAt)}</p>
      <p><strong>Page URL:</strong> ${escapeHtml(payload.pageUrl || "Not provided")}</p>
      <p><strong>Referrer:</strong> ${escapeHtml(payload.referrer || "Direct / not provided")}</p>
      <p><strong>User agent:</strong> ${escapeHtml(payload.userAgent || "Not provided")}</p>
      ${
        meta.notionUrl
          ? `<p><strong>Notion page:</strong> <a href="${escapeHtml(meta.notionUrl)}">${escapeHtml(meta.notionUrl)}</a></p>`
          : ""
      }
    </div>
  `.trim();
  const text = [
    "New newsletter signup",
    `Email: ${payload.email}`,
    `Name: ${payload.name || "Not provided"}`,
    `Site: ${payload.site || "Unknown"}`,
    `Source: ${payload.source || "Unknown"}`,
    `Subscribed at: ${meta.subscribedAt}`,
    `Page URL: ${payload.pageUrl || "Not provided"}`,
    `Referrer: ${payload.referrer || "Direct / not provided"}`,
    `User agent: ${payload.userAgent || "Not provided"}`,
    meta.notionUrl ? `Notion page: ${meta.notionUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [notifyEmail],
      reply_to: payload.email,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email send failed: ${errorText}`);
  }
}

export async function processSubscriberSignup(
  payload: SubscriberPayload,
): Promise<NewsletterResult> {
  const notionMeta = await createNotionSignupPage(payload);
  try {
    await sendNotificationEmail(payload, notionMeta);
  } catch (error) {
    console.error("Notification email failed after Notion signup:", error);
  }

  return {
    message:
      "Saved. We logged your info, sent Ian the details, and are taking you to the official Substack subscribe page.",
    redirectUrl: buildSubstackRedirectUrl(payload.source || payload.site || "newsletter"),
  };
}
