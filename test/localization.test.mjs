import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { translations } from "../src/i18n.ts";
import {
  localizeMarkup,
  localizeMetadata,
  resolveMessage,
} from "../src/localization.ts";
import { legacyProductHref } from "../src/navigation.ts";
import { productCopy } from "../src/product/i18n.ts";

test("renders both studio languages before JavaScript, with matching metadata", async () => {
  const source = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
  );
  for (const language of ["en", "fr"]) {
    const copy = translations[language];
    const html = localizeMetadata(
      localizeMarkup(source, language, copy),
      language,
      "https://kurobara.systems/",
      copy
    );
    assert.ok(html.includes(`<html lang="${language}">`));
    assert.ok(html.includes(copy.home.firstTitleLine));
    assert.ok(html.includes(copy.contact.secondTitleGrow));
    assert.ok(html.includes(copy.titles.accueil));
    assert.ok(html.includes(copy.metadata.socialImage));
    assert.ok(
      html.includes(`href="/site${language === "fr" ? "-fr" : ""}.webmanifest"`)
    );
    const canonical =
      language === "fr"
        ? "https://kurobara.systems/?lang=fr"
        : "https://kurobara.systems/";
    assert.ok(html.match(CANONICAL_PATTERN)[0].includes(`href="${canonical}"`));
    const schema = JSON.parse(html.match(SCHEMA_PATTERN)[1]);
    assert.equal(schema["@graph"][1].inLanguage, language);
    assert.equal(schema["@graph"][1].url, canonical);
    assert.equal(
      schema["@graph"][2].url,
      `https://kurobara.systems/kurobara/${language === "fr" ? "?lang=fr" : ""}`
    );
  }
});

test("escapes translated text, supports formatted closing tags and rejects unsafe targets", () => {
  const html = '<span data-i18n="message">Old</span\n>';
  assert.equal(
    localizeMarkup(html, "en", { message: '<b>Text & "quote"</b>' }),
    '<span data-i18n="message">&lt;b&gt;Text &amp; &quot;quote&quot;&lt;/b&gt;</span\n>'
  );
  assert.throws(
    () =>
      localizeMarkup('<p data-i18n="message"><span>Child</span></p>', "en", {
        message: "Lost child",
      }),
    CHILD_PATTERN
  );
  assert.throws(() => resolveMessage({}, "constructor.name"), MISSING_PATTERN);
});

test("preserves old product bookmarks at their dedicated site", () => {
  assert.equal(
    legacyProductHref("#contracts", "?lang=fr"),
    "/kurobara/?lang=fr#contracts"
  );
  assert.equal(legacyProductHref("#workflow", ""), "/kurobara/#workflow");
  assert.equal(legacyProductHref("#studio", ""), null);
  assert.equal(legacyProductHref("#contact", ""), null);
});

const SCHEMA_PATTERN =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/u;
const CANONICAL_PATTERN = /<link[^>]*rel="canonical"[^>]*>/u;
const CHILD_PATTERN = /child elements/u;
const MISSING_PATTERN = /Missing translation/u;

test("social previews use JPEG bytes matching their published MIME type", async () => {
  await Promise.all(
    [translations.en, translations.fr, productCopy.en, productCopy.fr].map(
      async (copy) => {
        const imagePath = new URL(copy.metadata.socialImage).pathname;
        assert.ok(imagePath.endsWith(".jpg"));
        const data = await readFile(
          new URL(`../public${imagePath}`, import.meta.url)
        );
        assert.deepEqual([...data.subarray(0, 3)], [255, 216, 255]);
      }
    )
  );
});
