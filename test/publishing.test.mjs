import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { translations } from "../src/i18n.ts";
import { localizeMarkup, localizeMetadata } from "../src/localization.ts";
import { publishingCopy } from "../src/publishing/i18n.ts";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const canonicalPattern = /<link[^>]*rel="canonical"[^>]*>/u;
const schemaPattern =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/u;

test("publishing renders both languages, metadata and cross-site links before JavaScript", async () => {
  const source = await read("publishing/index.html");
  for (const language of ["en", "fr"]) {
    const suffix = language === "fr" ? "?lang=fr" : "";
    const copy = publishingCopy[language];
    const html = localizeMetadata(
      localizeMarkup(source, language, copy),
      language,
      "https://kurobara.systems/publishing/",
      copy
    );
    assert.ok(html.includes(`<html lang="${language}">`));
    assert.ok(html.includes(copy.metadata.title));
    assert.ok(html.includes(copy.metadata.pageDescription));
    assert.ok(html.includes(copy.metadata.socialImage));
    assert.ok(
      html
        .match(canonicalPattern)[0]
        .includes(`href="https://kurobara.systems/publishing/${suffix}"`)
    );
    assert.ok(
      html.includes(
        `href="/publishing/site${language === "fr" ? "-fr" : ""}.webmanifest"`
      )
    );
    const graph = JSON.parse(html.match(schemaPattern)[1])["@graph"];
    const website = graph.find((entry) => entry["@type"] === "WebSite");
    assert.equal(website.url, `https://kurobara.systems/publishing/${suffix}`);
    assert.equal(website.inLanguage, language);
    assert.equal(html.includes("<iframe"), false);
    assert.ok(html.includes("X-rt17WHs0w"));
    assert.ok(html.includes("PLBiDWyKbQ7Zo"));
    for (const match of html.matchAll(
      /<a[^>]*data-site-link="([^"]+)"[^>]*>/gu
    )) {
      assert.ok(match[0].includes(`href="${match[1]}${suffix}"`));
    }
  }
});

test("studio exposes localized publishing links without changing rose perspectives", async () => {
  const source = await read("index.html");
  for (const language of ["en", "fr"]) {
    const html = localizeMarkup(source, language, translations[language]);
    const suffix = language === "fr" ? "?lang=fr" : "";
    assert.ok(html.includes(translations[language].navigation.publishing));
    assert.ok(html.includes(translations[language].studio.publishingAction));
    assert.equal(
      [...html.matchAll(/data-site-link="\/publishing\/"/gu)].length,
      2
    );
    assert.equal(
      [...html.matchAll(/data-preview="(studio|produits|expertises)"/gu)]
        .length,
      3
    );
    assert.ok(html.includes(`href="/publishing/${suffix}"`));
  }
});

test("publishing routes select the locale and keep physical French HTML internal", async () => {
  const [nginx, sitemap, vite] = await Promise.all([
    read("nginx.conf"),
    read("public/sitemap.xml"),
    read("vite.config.ts"),
  ]);
  assert.ok(nginx.includes("map $arg_lang $publishing_entry"));
  assert.ok(nginx.includes("try_files $publishing_entry =404;"));
  assert.ok(nginx.includes("location = /publishing/fr.html {\n    internal;"));
  assert.equal(
    [
      ...nginx.matchAll(
        /return 308 https:\/\/kurobara.systems\/publishing\/\$is_args\$args;/gu
      ),
    ].length,
    2
  );
  for (const suffix of ["", "?lang=fr"]) {
    assert.ok(
      sitemap.includes(
        `<loc>https://kurobara.systems/publishing/${suffix}</loc>`
      )
    );
  }
  assert.ok(vite.includes("./publishing/index.html"));
});
