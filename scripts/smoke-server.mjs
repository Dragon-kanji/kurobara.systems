import assert from "node:assert/strict";
import test from "node:test";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:8080");
const canonicalPattern = /<link[^>]*rel="canonical"[^>]*>/u;
const assetPattern = /(?:src|href)="(\/assets\/[^"?]+)"/gu;
const schemaPattern =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/u;
const assets = new Set();
const retiredContentPattern = /FIVEBORN|YouTube|audio(?:book)?/iu;
const request = (path) =>
  fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });

const verifySocialImage = async (path, language, html, route) => {
  const site = path === "/" ? "studio" : "product";
  const imagePath =
    path === "/games/"
      ? "/assets/romeria/social-5486cb5e.jpg"
      : `/assets/social/og-${site}-${language}.jpg`;
  const imageType = "image/jpeg";
  const signature = [255, 216, 255];
  assert.ok(html.includes(`https://kurobara.systems${imagePath}`), route);
  const image = await request(imagePath);
  assert.equal(image.status, 200);
  assert.ok(image.headers.get("content-type").startsWith(imageType));
  assert.deepEqual(
    [
      ...new Uint8Array(await image.arrayBuffer()).subarray(
        0,
        signature.length
      ),
    ],
    signature
  );
};

await test("production HTTP routes and language artifacts", async () => {
  await Promise.all(
    ["/", "/kurobara/", "/games/"].flatMap((path) =>
      ["en", "fr"].map(async (language) => {
        const suffix = language === "fr" ? "?lang=fr" : "";
        const route = `${path}${suffix}`;
        const response = await request(route);
        assert.equal(response.status, 200, route);
        assert.equal(response.headers.get("cache-control"), "no-cache", route);
        assert.ok(response.headers.get("content-security-policy"), route);
        const html = await response.text();
        assert.ok(html.includes(`<html lang="${language}">`), route);
        assert.ok(
          html
            .match(canonicalPattern)?.[0]
            .includes(`href="https://kurobara.systems${route}"`),
          route
        );
        const graph = JSON.parse(html.match(schemaPattern)[1])["@graph"];
        const website = graph.find((entry) => entry["@type"] === "WebSite");
        assert.equal(website.inLanguage, language);
        if (path === "/games/") {
          assert.ok(!retiredContentPattern.test(html), route);
          assert.ok(!html.includes("/publishing/"), route);
          assert.ok(
            html.includes(
              `https://playromeria.com/${language === "fr" ? "fr.html" : ""}`
            ),
            route
          );
          assert.ok(graph.some((entry) => entry["@type"] === "VideoGame"));
          assert.ok(!graph.some((entry) => entry["@type"] === "Book"));
        }
        for (const match of html.matchAll(assetPattern)) {
          assets.add(match[1]);
        }
        await verifySocialImage(path, language, html, route);
        const manifest = await request(
          `${path}site${language === "fr" ? "-fr" : ""}.webmanifest`
        );
        assert.equal(manifest.status, 200);
        const data = await manifest.json();
        assert.equal(data.lang, language);
        assert.equal(data.start_url, route);
        assert.equal(data.scope, path);
        if (path === "/games/") {
          assert.equal(data.name, "Kurobara Systems — Games");
          assert.equal(data.short_name, "Kurobara");
        }
      })
    )
  );

  await Promise.all(
    [...assets].map(async (path) => {
      const response = await request(path);
      assert.equal(response.status, 200, path);
      assert.ok((await response.arrayBuffer()).byteLength > 0, path);
    })
  );

  await Promise.all(
    [
      ["/index.html?lang=fr", "https://kurobara.systems/?lang=fr"],
      ["/games?lang=fr", "https://kurobara.systems/games/?lang=fr"],
      ["/games/index.html?lang=fr", "https://kurobara.systems/games/?lang=fr"],
      ["/publishing?lang=fr", "https://kurobara.systems/games/?lang=fr"],
      ["/publishing/?lang=fr", "https://kurobara.systems/games/?lang=fr"],
      [
        "/publishing/index.html?lang=fr",
        "https://kurobara.systems/games/?lang=fr",
      ],
      ["/kurobara?lang=fr", "https://kurobara.systems/kurobara/?lang=fr"],
      [
        "/kurobara/index.html?lang=fr",
        "https://kurobara.systems/kurobara/?lang=fr",
      ],
    ].map(async ([path, location]) => {
      const response = await request(path);
      assert.equal(response.status, 308, path);
      assert.equal(response.headers.get("location"), location, path);
    })
  );

  await Promise.all(
    [
      "/studio-fr.html",
      "/publishing/fr.html",
      "/publishing/not-a-page",
      "/assets/publishing/fiveborn-chapter-01-bf796334.png",
      "/assets/publishing/kurobara-rose-b45125b2.svg",
      "/games/fr.html",
      "/games/not-a-page",
      "/kurobara/fr.html",
      "/not-a-page",
      "/kurobara/not-a-page",
    ].map(async (path) => {
      assert.equal((await request(path)).status, 404, path);
    })
  );

  const health = await request("/healthz");
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.ok(health.headers.get("x-robots-tag").includes("noindex"));
  const unsupported = await request("/?lang=de");
  assert.ok((await unsupported.text()).includes('<html lang="en">'));
  const sitemap = await request("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.ok(sitemapText.includes("https://kurobara.systems/kurobara/?lang=fr"));
  assert.ok(sitemapText.includes("https://kurobara.systems/games/?lang=fr"));
  assert.ok(!sitemapText.includes("/publishing/"));
  process.stdout.write(
    `Verified studio, product and games in both languages, ${assets.size} assets, manifests, social previews, redirects, 404s and health at ${base.origin}.\n`
  );
});
