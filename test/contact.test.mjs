import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ContactIdempotency, submitContact } from "../src/contact.ts";

const CONTACT_MARKUP_PATTERNS = [
  /<form[\s\S]*?action="\/api\/contact"[\s\S]*?method="post"/u,
  /id="contact-name"[\s\S]*?maxlength="120"/u,
  /id="contact-email"[\s\S]*?maxlength="254"[\s\S]*?required/u,
  /id="contact-company"[\s\S]*?maxlength="120"/u,
  /id="contact-message"[\s\S]*?maxlength="5000"[\s\S]*?required/u,
  /name="website"[\s\S]*?tabindex="-1"/u,
  /aria-live="polite"/u,
  /href="mailto:hello@leandre-desmaretz-lespagnol\.com"/u,
];

const payload = {
  company: "Example Studio",
  email: "person@example.test",
  locale: "en",
  message: "A synthetic test message.",
  name: "Test Person",
  startedAt: 1_700_000_000_000,
  website: "",
};

test("publishes accessible fields, limits and a non-tabbable honeypot", async () => {
  const markup = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
  );

  for (const pattern of CONTACT_MARKUP_PATTERNS) {
    assert.match(markup, pattern);
  }
});

test("reuses an idempotency key for the same payload and resets on change or success", () => {
  let sequence = 0;
  const keys = new ContactIdempotency(() => {
    sequence += 1;
    return `key-${sequence}`;
  });

  assert.equal(keys.forPayload(payload), "key-1");
  assert.equal(keys.forPayload({ ...payload }), "key-1");
  assert.equal(keys.forPayload({ ...payload, message: "Changed" }), "key-2");
  keys.reset();
  assert.equal(keys.forPayload({ ...payload, message: "Changed" }), "key-3");
});

test("sends the expected same-origin request and accepts only a valid 202 response", async () => {
  let captured;
  const result = await submitContact(payload, "same-request-key", (...args) => {
    captured = args;
    return Promise.resolve(
      new Response(JSON.stringify({ ok: true, reference: "KRB-123" }), {
        headers: { "Content-Type": "application/json" },
        status: 202,
      })
    );
  });

  assert.deepEqual(result, { reference: "KRB-123", status: "success" });
  assert.equal(captured[0], "/api/contact");
  assert.equal(captured[1].method, "POST");
  assert.equal(captured[1].headers["Idempotency-Key"], "same-request-key");
  assert.deepEqual(JSON.parse(captured[1].body), payload);

  const invalidResponses = [
    new Response(JSON.stringify({ ok: true, reference: "KRB-123" }), {
      status: 200,
    }),
    new Response(JSON.stringify({ error: "rejected", ok: false }), {
      status: 202,
    }),
    new Response("not json", { status: 202 }),
  ];
  const invalidResults = await Promise.all(
    invalidResponses.map((response) =>
      submitContact(payload, "key", () => Promise.resolve(response))
    )
  );
  assert.deepEqual(
    invalidResults,
    invalidResponses.map(() => ({ status: "error" }))
  );
});

test("reports rate limits and network failures without claiming success", async () => {
  assert.deepEqual(
    await submitContact(payload, "key", () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "rate_limited", ok: false }), {
          headers: { "Retry-After": "60" },
          status: 429,
        })
      )
    ),
    { retryAfter: "60", status: "rate-limit" }
  );
  assert.deepEqual(
    await submitContact(payload, "key", () =>
      Promise.reject(new TypeError("offline"))
    ),
    { status: "error" }
  );
});
