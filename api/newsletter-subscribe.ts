import {
  SubscriberValidationError,
  parseSubscriberPayload,
  processSubscriberSignup,
} from "./_lib/subscriber.js";

type RequestLike = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_RATE_LIMIT_BUCKETS = 1_000;
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SIGNUP_RESULTS = 1_000;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const signupResults = new Map<
  string,
  { result: Awaited<ReturnType<typeof processSubscriberSignup>>; resetAt: number }
>();

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
) {
  const value = headers[name] || headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getHostOrigin(req: RequestLike) {
  const host = getHeader(req.headers, "host");
  if (!host) {
    return undefined;
  }

  const protocol = getHeader(req.headers, "x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

function getRequestOrigin(req: RequestLike) {
  return getHeader(req.headers, "origin") || getHostOrigin(req);
}

function getAllowedOrigins(req: RequestLike) {
  const configured = (
    process.env.NEWSLETTER_ALLOWED_ORIGINS ||
    process.env.SITE_URL ||
    ""
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
  const requestOrigin = getRequestOrigin(req);
  const hostOrigin = getHostOrigin(req);

  return new Set(
    [
      ...configured,
      vercelUrl,
      hostOrigin,
      requestOrigin?.includes("localhost") ? requestOrigin : undefined,
    ].filter(Boolean) as string[],
  );
}

function assertAllowedOrigin(req: RequestLike) {
  const requestOrigin = getRequestOrigin(req);
  const allowedOrigins = getAllowedOrigins(req);

  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    throw new SubscriberValidationError("Request origin is not allowed.");
  }
}

function assertBodySize(req: RequestLike) {
  const contentLength = getHeader(req.headers, "content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new SubscriberValidationError("Request body is too large.");
  }

  const size =
    typeof req.body === "string"
      ? Buffer.byteLength(req.body)
      : Buffer.byteLength(JSON.stringify(req.body || {}));
  if (size > MAX_BODY_BYTES) {
    throw new SubscriberValidationError("Request body is too large.");
  }
}

function isTrustedProxyHeaderSource() {
  return Boolean(process.env.VERCEL || process.env.TRUST_PROXY_HEADERS === "true");
}

function normalizeClientKey(value: string | undefined) {
  const key = value?.split(",")[0]?.trim();
  return key && key.length <= 64 ? key : "unknown-ip";
}

function getClientKey(req: RequestLike) {
  if (!isTrustedProxyHeaderSource()) {
    return "unknown-ip";
  }

  return normalizeClientKey(getHeader(req.headers, "x-forwarded-for"));
}

function sweepExpiredEntries<T extends { resetAt: number }>(
  entries: Map<string, T>,
  now: number,
) {
  for (const [key, value] of entries) {
    if (value.resetAt <= now) {
      entries.delete(key);
    }
  }
}

function deleteOldestEntry<T>(entries: Map<string, T>) {
  const oldestKey = entries.keys().next().value as string | undefined;
  if (oldestKey) {
    entries.delete(oldestKey);
  }
}

function getIdempotencyKey(req: RequestLike, email: string) {
  return `${getClientKey(req)}:${email}`;
}

function getCachedSignupResult(req: RequestLike, email: string) {
  const key = getIdempotencyKey(req, email);
  const cached = signupResults.get(key);

  if (!cached) {
    return undefined;
  }

  if (cached.resetAt <= Date.now()) {
    signupResults.delete(key);
    return undefined;
  }

  return cached.result;
}

function cacheSignupResult(
  req: RequestLike,
  email: string,
  result: Awaited<ReturnType<typeof processSubscriberSignup>>,
) {
  const now = Date.now();
  sweepExpiredEntries(signupResults, now);
  if (signupResults.size >= MAX_SIGNUP_RESULTS) {
    deleteOldestEntry(signupResults);
  }

  signupResults.set(getIdempotencyKey(req, email), {
    result,
    resetAt: now + IDEMPOTENCY_WINDOW_MS,
  });
}

function assertRateLimit(req: RequestLike) {
  const now = Date.now();
  const key = getClientKey(req);
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (!bucket) {
      sweepExpiredEntries(rateLimitBuckets, now);
    }

    if (!bucket && rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
      throw new SubscriberValidationError("Too many signup attempts. Please try again later.");
    }

    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new SubscriberValidationError("Too many signup attempts. Please try again later.");
  }

  bucket.count += 1;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  try {
    assertAllowedOrigin(req);
    assertBodySize(req);
    const payload = parseSubscriberPayload(req.body, req.headers);
    assertRateLimit(req);
    const cachedResult = getCachedSignupResult(req, payload.email);
    if (cachedResult) {
      res.status(200).json(cachedResult);
      return;
    }

    const result = await processSubscriberSignup(payload);
    cacheSignupResult(req, payload.email, result);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof SubscriberValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error("Newsletter signup failed:", error);
    res.status(500).json({ message: "Unable to process newsletter signup." });
  }
}
