import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { translations } from "../src/i18n.ts";
import { localizeMarkup, localizeMetadata } from "../src/localization.ts";
import { productCopy } from "../src/product/i18n.ts";
import { publishingCopy } from "../src/publishing/i18n.ts";

const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist"
);
await Promise.all(
  [
    {
      base: "https://kurobara.systems/",
      copy: translations,
      file: "index.html",
      french: "studio-fr.html",
      name: "Kurobara Systems",
    },
    {
      base: "https://kurobara.systems/publishing/",
      copy: publishingCopy,
      file: "publishing/index.html",
      french: "publishing/fr.html",
      name: "Kurobara Publishing",
    },
    {
      base: "https://kurobara.systems/kurobara/",
      copy: productCopy,
      file: "kurobara/index.html",
      french: "kurobara/fr.html",
      name: "Kurobara",
    },
  ].map(async (page) => {
    const html = await readFile(path.join(dist, page.file), "utf8");
    await Promise.all(
      ["en", "fr"].map(async (language) => {
        const copy = page.copy[language];
        const localized = localizeMetadata(
          localizeMarkup(html, language, copy),
          language,
          page.base,
          copy
        );
        await writeFile(
          path.join(dist, language === "fr" ? page.french : page.file),
          localized
        );
        const basePath = new URL(page.base).pathname;
        const product = basePath === "/kurobara/";
        const publishing = basePath === "/publishing/";
        await writeFile(
          path.join(
            dist,
            basePath,
            `site${language === "fr" ? "-fr" : ""}.webmanifest`
          ),
          `${JSON.stringify(
            {
              background_color: product ? "#000000" : "#f6f4ee",
              description: copy.metadata.websiteDescription,
              display: "standalone",
              icons: [],
              lang: language,
              name: page.name,
              scope: basePath,
              short_name: publishing ? "Kurobara Publishing" : "Kurobara",
              start_url: `${basePath}${language === "fr" ? "?lang=fr" : ""}`,
              theme_color: product ? "#000000" : "#f6f4ee",
            },
            null,
            2
          )}\n`
        );
      })
    );
  })
);
process.stdout.write(
  "Built English and French studio, product and publishing pages.\n"
);
