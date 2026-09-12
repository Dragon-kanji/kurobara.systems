import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { localizeMarkup, localizeMetadata } from "../src/localization.ts";
import { productCopy } from "../src/product/i18n.ts";

const websiteRoot = fileURLToPath(new URL("..", import.meta.url));
const productHtmlPath = `${websiteRoot}/kurobara/index.html`;
const productMainPath = `${websiteRoot}/src/product/main.ts`;
const structuredDataPattern =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const localizationAttributePattern = /data-i18n(?:-label|-content)?="([^"]+)"/g;

const getMessage = (copy, key) =>
  key.split(".").reduce((current, part) => current?.[part], copy);

const leafPaths = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null
      ? leafPaths(child, path)
      : [path];
  });

test("keeps the deployed product semantics in its dedicated entry", async () => {
  const html = await readFile(productHtmlPath, "utf8");
  const main = await readFile(productMainPath, "utf8");

  assert.ok(html.includes("<ol"));
  assert.ok(html.includes('class="stage-list"'));
  assert.ok(
    html.includes('<li class="data-stage is-active" data-stage="discover">')
  );
  assert.ok(html.includes('<fieldset class="extract-rail">'));
  assert.ok(html.includes("<legend"));
  assert.ok(html.includes('class="contract-map"'));
  assert.ok(html.includes('role="img"'));
  assert.ok(html.includes('class="terminal"'));
  assert.ok(html.includes('src="/src/product/main.ts"'));

  assert.ok(main.includes("@fontsource/bebas-neue/latin-400.css"));
  assert.ok(main.includes("@fontsource/ibm-plex-mono/latin-400.css"));
  assert.ok(main.includes("@fontsource/ibm-plex-mono/latin-500.css"));
  assert.ok(main.includes('import "./styles.css"'));
  assert.equal(main.toLowerCase().includes("webmcp"), false);
});

test("uses the product route for canonical and product metadata", async () => {
  const html = await readFile(productHtmlPath, "utf8");

  assert.ok(
    html.includes(
      '<link href="https://kurobara.systems/kurobara/" rel="canonical">'
    )
  );
  assert.ok(
    html.includes(
      '<meta content="https://kurobara.systems/kurobara/" property="og:url">'
    )
  );
  assert.ok(html.includes('data-language="en"'));
  assert.ok(html.includes('data-language="fr"'));
  assert.ok(html.includes('data-i18n="navigation.studio"'));
  assert.ok(html.includes('data-site-link="/"'));
  assert.ok(html.includes("Studio ↗"));

  const structuredDataSource = html.match(structuredDataPattern)?.[1];
  assert.ok(structuredDataSource);
  const structuredData = JSON.parse(structuredDataSource);
  const organization = structuredData["@graph"].find(
    (entry) => entry["@type"] === "Organization"
  );
  const website = structuredData["@graph"].find(
    (entry) => entry["@type"] === "WebSite"
  );
  const product = structuredData["@graph"].find(
    (entry) => entry["@type"] === "SoftwareApplication"
  );

  assert.equal(organization.url, "https://kurobara.systems/");
  assert.equal(website.url, "https://kurobara.systems/kurobara/");
  assert.equal(product.url, "https://kurobara.systems/kurobara/");
});

test("keeps complete English and French product dictionaries in parity", () => {
  const englishPaths = leafPaths(productCopy.en).sort();
  const frenchPaths = leafPaths(productCopy.fr).sort();

  assert.deepEqual(frenchPaths, englishPaths);
  assert.ok(englishPaths.length >= 75);
  for (const language of ["en", "fr"]) {
    for (const path of englishPaths) {
      const value = getMessage(productCopy[language], path);
      assert.equal(typeof value, "string", `${language}.${path} must be text`);
      assert.notEqual(
        value.trim(),
        "",
        `${language}.${path} must not be empty`
      );
    }
  }
});

test("resolves every product localization attribute in both languages", async () => {
  const html = await readFile(productHtmlPath, "utf8");
  const localizationKeys = [...html.matchAll(localizationAttributePattern)].map(
    (match) => match[1]
  );

  assert.ok(localizationKeys.length >= 65);
  for (const language of ["en", "fr"]) {
    for (const key of localizationKeys) {
      assert.equal(
        typeof getMessage(productCopy[language], key),
        "string",
        `${language}.${key} must resolve`
      );
    }
  }
});

test("renders complete localized product markup for both languages", async () => {
  const html = await readFile(productHtmlPath, "utf8");

  for (const language of ["en", "fr"]) {
    const copy = productCopy[language];
    const localized = localizeMetadata(
      localizeMarkup(html, language, copy),
      language,
      "https://kurobara.systems/kurobara/",
      copy
    );

    assert.ok(localized.includes(`<html lang="${language}">`));
    assert.ok(
      localized.includes(
        `<title data-i18n="metadata.title">${copy.metadata.title}</title>`
      )
    );
    assert.ok(
      localized.includes(
        `href="https://kurobara.systems/kurobara/${
          language === "fr" ? "?lang=fr" : ""
        }" rel="canonical"`
      )
    );
    assert.ok(localized.includes(`>${copy.hero.firstLine}</p>`));
    assert.ok(localized.includes(copy.navigation.studio));
    const schema = JSON.parse(localized.match(structuredDataPattern)[1]);
    assert.equal(
      schema["@graph"].find((entry) => entry["@type"] === "SoftwareApplication")
        .image,
      copy.metadata.socialImage
    );
    assert.ok(
      localized.includes(`href="/${language === "fr" ? "?lang=fr" : ""}"`)
    );
  }
});

test("keeps forbidden typography out of the product sources", async () => {
  const paths = [
    productHtmlPath,
    productMainPath,
    `${websiteRoot}/src/product/i18n.ts`,
    `${websiteRoot}/src/product/styles.css`,
  ];
  const forbiddenCharacter = String.fromCodePoint(0x20_14);

  await Promise.all(
    paths.map(async (path) => {
      const source = await readFile(path, "utf8");
      assert.equal(source.includes(forbiddenCharacter), false, path);
    })
  );
});
