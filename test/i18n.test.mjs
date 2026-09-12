import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LANGUAGE,
  languageSearch,
  readLanguage,
  translations,
} from "../src/i18n.ts";

const leafPaths = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null
      ? leafPaths(child, path)
      : [path];
  });

test("uses English by default and accepts only the French query value", () => {
  assert.equal(DEFAULT_LANGUAGE, "en");
  assert.equal(readLanguage(""), "en");
  assert.equal(readLanguage("?source=homepage"), "en");
  assert.equal(readLanguage("?lang=en"), "en");
  assert.equal(readLanguage("?lang=FR"), "en");
  assert.equal(readLanguage("?lang=fr"), "fr");
  assert.equal(readLanguage("source=homepage&lang=fr"), "fr");
});

test("builds language searches while preserving unrelated parameters", () => {
  assert.equal(languageSearch("", "en"), "");
  assert.equal(languageSearch("?lang=fr", "en"), "");
  assert.equal(
    languageSearch("?campaign=launch&lang=fr&ref=studio", "en"),
    "?campaign=launch&ref=studio"
  );
  assert.equal(
    languageSearch("?campaign=launch", "fr"),
    "?campaign=launch&lang=fr"
  );
  assert.equal(
    languageSearch("?campaign=launch&lang=en&ref=studio", "fr"),
    "?campaign=launch&lang=fr&ref=studio"
  );
});

test("keeps complete English and French dictionaries in parity", () => {
  const englishPaths = leafPaths(translations.en).sort();
  const frenchPaths = leafPaths(translations.fr).sort();

  assert.deepEqual(frenchPaths, englishPaths);
  assert.ok(englishPaths.length >= 75);
  for (const language of ["en", "fr"]) {
    for (const path of englishPaths) {
      const value = path
        .split(".")
        .reduce((current, key) => current[key], translations[language]);
      assert.equal(typeof value, "string", `${language}.${path} must be text`);
      assert.notEqual(
        value.trim(),
        "",
        `${language}.${path} must not be empty`
      );
    }
  }

  assert.equal(translations.en.product.exploreKurobara, "Explore Kurobara");
  assert.equal(translations.fr.product.exploreKurobara, "Explorer Kurobara");
});
