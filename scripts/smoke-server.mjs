import assert from "node:assert/strict";
import test from "node:test";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:8080");
const canonicalPattern = /<link[^>]*rel="canonical"[^>]*>/u;
const assetPattern = /(?:src|href)="(\/assets\/[^"?]+)"/gu;
const schemaPattern =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/u;
const assets = new Set();
const request = (path) =>
  fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });

await test("production HTTP routes and language artifacts", async () => {
  await Promise.all(
    ["/", "/kurobara/"].flatMap((path) =>
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
        assert.equal(
          graph.find((entry) => entry["@type"] === "WebSite").inLanguage,
          language
        );
        for (const match of html.matchAll(assetPattern)) {
          assets.add(match[1]);
        }
        const site = path === "/" ? "studio" : "product";
        const imagePath = `/assets/social/og-${site}-${language}.jpg`;
        assert.ok(html.includes(`https://kurobara.systems${imagePath}`), route);
        const image = await request(imagePath);
        assert.equal(image.status, 200);
        assert.ok(image.headers.get("content-type").startsWith("image/jpeg"));
        assert.deepEqual(
          [...new Uint8Array(await image.arrayBuffer()).subarray(0, 3)],
          [255, 216, 255]
        );
        const manifest = await request(
          `${path}site${language === "fr" ? "-fr" : ""}.webmanifest`
        );
        assert.equal(manifest.status, 200);
        const data = await manifest.json();
        assert.equal(data.lang, language);
        assert.equal(data.start_url, route);
        assert.equal(data.scope, path);
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
  assert.ok(
    (await sitemap.text()).includes(
      "https://kurobara.systems/kurobara/?lang=fr"
    )
  );
  process.stdout.write(
    `Verified both sites and languages, ${assets.size} assets, manifests, social previews, redirects, 404s and health at ${base.origin}.\n`
  );
});
