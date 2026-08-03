#!/usr/bin/env node
/**
 * Guards the Netlify Forms wiring for the newsletter signup.
 *
 * Two real bugs motivated this, both silent in the browser:
 *
 *   1. Netlify never detected the form, so every signup was dropped while the
 *      UI reported success. public/__forms.html is what makes detection work —
 *      deleting it re-breaks signups with no visible symptom.
 *   2. The client sent a payload that did not match the declared form: the
 *      honeypot was never sent, and five declared fields arrived blank.
 *
 * Netlify only stores fields declared on the form it detected, so any drift
 * between src/lib/newsletter.ts and the spacers loses data silently. This
 * checks the built output, because that is what actually gets deployed.
 *
 * Run after `npm run build`.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT = join(root, "src/lib/newsletter.ts");
const SPACERS = ["dist/__forms.html", "dist/index.html"];

/** The spacer Netlify actually serves as a real file; the signup depends on it. */
const LOAD_BEARING = "dist/__forms.html";

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

// --- what the client sends -------------------------------------------------

const client = readFileSync(CLIENT, "utf8");

/** Resolve `export const NAME = "value"` so append(CONST, …) can be followed. */
function constants(source) {
  const found = new Map();
  for (const m of source.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*"([^"]*)"/g)) {
    found.set(m[1], m[2]);
  }
  return found;
}

const consts = constants(client);
const sent = new Set();

for (const m of client.matchAll(/payload\.append\(\s*(?:"([^"]+)"|([A-Za-z_][\w]*))/g)) {
  const [, literal, identifier] = m;
  if (literal) {
    sent.add(literal);
    continue;
  }
  const resolved = consts.get(identifier);
  if (resolved) {
    sent.add(resolved);
  } else {
    warnings.push(
      `could not resolve field name from \`payload.append(${identifier}, …)\` — ` +
        `check it by hand`,
    );
  }
}

const formName = consts.get("NEWSLETTER_FORM_NAME");
const honeypot = consts.get("NEWSLETTER_HONEYPOT");

if (!formName) fail(`${CLIENT}: NEWSLETTER_FORM_NAME not found`);
if (!honeypot) fail(`${CLIENT}: NEWSLETTER_HONEYPOT not found`);
if (sent.size === 0) fail(`${CLIENT}: no payload.append(...) fields found`);

// `form-name` is the routing key, not a stored field.
sent.delete("form-name");

// --- what each spacer declares ---------------------------------------------

function declaredFields(html, name) {
  const form = html.match(
    new RegExp(`<form[^>]*name=["']${name}["'][\\s\\S]*?</form>`, "i"),
  );
  if (!form) return null;
  const block = form[0];
  const fields = new Set();
  for (const m of block.matchAll(/<(?:input|textarea|select)[^>]*name=["']([^"']+)["']/gi)) {
    fields.add(m[1]);
  }
  return { block, fields };
}

if (!existsSync(join(root, LOAD_BEARING))) {
  fail(
    `${LOAD_BEARING} is missing. Netlify detects the newsletter form from this ` +
      `file; without it signups are silently dropped. It is built from ` +
      `public/__forms.html — did that get deleted?`,
  );
}

for (const rel of SPACERS) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    if (rel !== LOAD_BEARING) warnings.push(`${rel} not found — skipped`);
    continue;
  }

  const declared = declaredFields(readFileSync(path, "utf8"), formName);
  if (!declared) {
    fail(`${rel}: no <form name="${formName}"> found`);
    continue;
  }

  const { block, fields } = declared;

  if (!/data-netlify=["']true["']/i.test(block)) {
    fail(`${rel}: form is missing data-netlify="true", so Netlify will not detect it`);
  }

  const honeypotAttr = block.match(/netlify-honeypot=["']([^"']+)["']/i);
  if (!honeypotAttr) {
    fail(`${rel}: form declares no netlify-honeypot`);
  } else if (honeypotAttr[1] !== honeypot) {
    fail(
      `${rel}: netlify-honeypot is "${honeypotAttr[1]}" but the client sends ` +
        `"${honeypot}"`,
    );
  }

  for (const field of sent) {
    if (!fields.has(field)) {
      fail(
        `${rel}: the client sends "${field}" but the form does not declare it — ` +
          `Netlify will discard that value`,
      );
    }
  }

  for (const field of fields) {
    if (field !== "form-name" && !sent.has(field)) {
      warnings.push(
        `${rel}: declares "${field}" but the client never sends it — ` +
          `every submission stores it blank`,
      );
    }
  }
}

// --- report ----------------------------------------------------------------

for (const w of warnings) console.warn(`warning: ${w}`);

if (errors.length > 0) {
  console.error(`\nNetlify form check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `Netlify form check passed: "${formName}" declared consistently in ` +
    `${SPACERS.join(", ")} with ${sent.size} client fields + honeypot "${honeypot}".`,
);
