import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { gamesCopy } from "../src/games/i18n.ts";
import { translations } from "../src/i18n.ts";
import { localizeMarkup, localizeMetadata } from "../src/localization.ts";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const canonicalPattern = /<link[^>]*rel="canonical"[^>]*>/u;
const retiredContentPattern = /FIVEBORN|YouTube|audio(?:book)?/iu;
const retiredLinkPattern = /\/publishing\//u;
const schemaPattern =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/u;

test("games page renders Romeria in both languages with localized metadata and schema", async () => {
  const source = await read("games/index.html");
  for (const language of ["en", "fr"]) {
    const suffix = language === "fr" ? "?lang=fr" : "";
    const copy = gamesCopy[language];
    const html = localizeMetadata(
      localizeMarkup(source, language, copy),
      language,
      "https://kurobara.systems/games/",
      copy
    );

    assert.ok(html.includes(`<html lang="${language}">`));
    for (const value of [
      copy.metadata.title,
      copy.metadata.pageDescription,
      copy.metadata.websiteDescription,
      copy.metadata.socialImage,
      copy.metadata.gameDescription,
      copy.metadata.gameUrl,
    ]) {
      assert.ok(html.includes(value), `${language}: missing ${value}`);
    }
    assert.ok(
      html
        .match(canonicalPattern)?.[0]
        .includes(`href="https://kurobara.systems/games/${suffix}"`)
    );
    assert.ok(
      html.includes(
        `href="/games/site${language === "fr" ? "-fr" : ""}.webmanifest"`
      )
    );

    const graph = JSON.parse(html.match(schemaPattern)[1])["@graph"];
    const website = graph.find((entry) => entry["@type"] === "WebSite");
    assert.equal(website.url, `https://kurobara.systems/games/${suffix}`);
    assert.equal(website.inLanguage, language);
    assert.equal(website.description, copy.metadata.websiteDescription);
    const game = graph.find((entry) => entry["@type"] === "VideoGame");
    assert.ok(game, `${language}: VideoGame structured data is missing`);
    assert.equal(game.url, copy.metadata.gameUrl);
    assert.equal(game.description, copy.metadata.gameDescription);

    const externalGameLinks = [
      ...html.matchAll(/<a\b[^>]*data-i18n-href="metadata\.gameUrl"[^>]*>/gu),
    ];
    assert.ok(
      externalGameLinks.length > 0,
      `${language}: game link is missing`
    );
    for (const [tag] of externalGameLinks) {
      assert.ok(tag.includes(`href="${copy.metadata.gameUrl}"`));
    }

    assert.doesNotMatch(html, retiredContentPattern);
    assert.doesNotMatch(html, retiredLinkPattern);
  }
});

test("studio exposes localized Games links", async () => {
  const source = await read("index.html");
  for (const language of ["en", "fr"]) {
    const html = localizeMarkup(source, language, translations[language]);
    assert.ok(html.includes(translations[language].navigation.games));
    assert.ok(html.includes(translations[language].studio.gamesAction));
    assert.ok(
      html.includes(`href="/games/${language === "fr" ? "?lang=fr" : ""}"`)
    );
  }
});

test("games routes localize French internally and retire legacy publishing routes", async () => {
  const [nginx, sitemap, vite] = await Promise.all([
    read("nginx.conf"),
    read("public/sitemap.xml"),
    read("vite.config.ts"),
  ]);
  assert.ok(nginx.includes("map $arg_lang $games_entry"));
  assert.ok(nginx.includes("try_files $games_entry =404;"));
  assert.ok(nginx.includes("location = /games/fr.html {\n    internal;"));
  assert.ok(nginx.includes("location = /publishing/fr.html {\n    internal;"));
  for (const path of [
    "/publishing",
    "/publishing/",
    "/publishing/index.html",
    "/games",
    "/games/index.html",
  ]) {
    assert.ok(
      nginx.includes(
        `location = ${path} {\n    return 308 https://kurobara.systems/games/$is_args$args;`
      )
    );
  }
  assert.ok(nginx.includes("(kurobara|games)/"));
  assert.ok(vite.includes("./games/index.html"));
  assert.ok(!vite.includes("./publishing/index.html"));
  for (const suffix of ["", "?lang=fr"]) {
    assert.ok(
      sitemap.includes(`<loc>https://kurobara.systems/games/${suffix}</loc>`)
    );
  }
  assert.ok(!sitemap.includes("/publishing/"));
});
