import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = await mkdtemp(path.join(os.tmpdir(), "eclosion-preview-"));
try {
  await build({
    build: { emptyOutDir: true, outDir: temporary },
    mode: "standalone",
    root,
  });
  const html = await readFile(path.join(temporary, "index.html"), "utf8");
  const scriptMatch = html.match(
    /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/u
  );
  const styleMatch = html.match(
    /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/u
  );
  const imageMatch = html.match(/src="([^"]+wordmark[^"]+\.svg)"/u);
  if (!(scriptMatch && styleMatch && imageMatch)) {
    throw new Error(
      "The preview build is missing its script, stylesheet or wordmark."
    );
  }
  const asset = (url) =>
    readFile(
      path.join(temporary, url.startsWith("/") ? url.slice(1) : url),
      "utf8"
    );
  const [script, style, wordmark, favicon] = await Promise.all([
    asset(scriptMatch[1]),
    asset(styleMatch[1]),
    asset(imageMatch[1]),
    readFile(path.join(temporary, "favicon.svg"), "utf8"),
  ]);
  const svgData = (svg) =>
    `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const preview = html
    .replace(scriptMatch[0], () => `<script type="module">${script}</script>`)
    .replace(styleMatch[0], () => `<style>${style}</style>`)
    .replace(imageMatch[0], () => `src="${svgData(wordmark)}"`)
    .replace('href="/favicon.svg"', () => `href="${svgData(favicon)}"`)
    .replace(/\s*<link rel="(?:manifest|modulepreload)"[^>]*>/gu, "")
    .replaceAll(
      'data-site-link="/kurobara/"',
      'data-site-link="https://kurobara.systems/kurobara/"'
    );
  await writeFile(path.join(root, "dist/eclosion-preview.html"), preview);
  process.stdout.write(
    "Created dist/eclosion-preview.html. Open it in a browser.\n"
  );
} finally {
  await rm(temporary, { force: true, recursive: true });
}
