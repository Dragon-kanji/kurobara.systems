import { type Language, languageSearch } from "./i18n.ts";

const TAG_END = /\s*\/?>$/u;
const HTML_TAG = /<html\b[^>]*>/u;
const CHILD_TAG = /<[a-z]/iu;
const CANONICAL_TAG = /<link\b[^>]*\srel="canonical"[^>]*>/u;
const OG_URL_TAG = /<meta\b[^>]*\sproperty="og:url"[^>]*>/u;
const MANIFEST_TAG = /<link\b[^>]*\srel="manifest"[^>]*>/u;
const SCHEMA_TAG =
  /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/u;

export const resolveMessage = (copy: unknown, key: string): string => {
  let value = copy;
  for (const segment of key.split(".")) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, segment)) {
      throw new Error(`Missing translation: ${key}`);
    }
    value = (value as Record<string, unknown>)[segment];
  }
  if (typeof value !== "string") {
    throw new Error(`Translation must be text: ${key}`);
  }
  return value;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const replaceAttribute = (tag: string, name: string, value: string): string => {
  const pattern = new RegExp(`\\s${name}="[^"]*"`, "u");
  const attribute = `${name}="${escapeHtml(value)}"`;
  return pattern.test(tag)
    ? tag.replace(pattern, () => ` ${attribute}`)
    : tag.replace(TAG_END, (ending) => ` ${attribute}${ending}`);
};

export const canonicalUrl = (base: string, language: Language): string =>
  `${base}${languageSearch("", language)}`;

export const localizedSiteUrl = (base: string, language: Language): string => {
  const [page, fragment] = base.split("#");
  return `${canonicalUrl(page, language)}${fragment ? `#${fragment}` : ""}`;
};

const manifestUrl = (base: string, language: Language): string =>
  `${new URL(base).pathname}site${language === "fr" ? "-fr" : ""}.webmanifest`;

export const localizeMarkup = (
  html: string,
  language: Language,
  copy: unknown
): string => {
  let localized = html.replace(HTML_TAG, (tag) =>
    replaceAttribute(tag, "lang", language)
  );
  localized = localized.replace(
    /(<([a-z][a-z0-9]*)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2\s*>)/gu,
    (
      _match,
      opening: string,
      _tag: string,
      key: string,
      old: string,
      closing: string
    ) => {
      if (CHILD_TAG.test(old)) {
        throw new Error(`Translation target contains child elements: ${key}`);
      }
      return `${opening}${escapeHtml(resolveMessage(copy, key))}${closing}`;
    }
  );
  for (const [data, attribute] of [
    ["data-i18n-label", "aria-label"],
    ["data-i18n-content", "content"],
  ] as const) {
    const pattern = new RegExp(`<[^>]+\\s${data}="([^"]+)"[^>]*>`, "gu");
    localized = localized.replace(pattern, (tag, key: string) =>
      replaceAttribute(tag, attribute, resolveMessage(copy, key))
    );
  }
  return localized
    .replace(
      /<a\b[^>]*\sdata-language="(en|fr)"[^>]*>/gu,
      (tag, target: Language) => {
        const href = languageSearch("", target) || "./";
        const current = target === language ? "true" : "false";
        return replaceAttribute(
          replaceAttribute(tag, "href", href),
          "aria-current",
          current
        );
      }
    )
    .replace(
      /<a\b[^>]*\sdata-site-link="([^"]+)"[^>]*>/gu,
      (tag, base: string) =>
        replaceAttribute(tag, "href", localizedSiteUrl(base, language))
    );
};

export const localizedSchema = (
  schema: unknown,
  language: Language,
  base: string,
  copy: unknown
): unknown => {
  if (
    !schema ||
    typeof schema !== "object" ||
    !("@graph" in schema) ||
    !Array.isArray(schema["@graph"])
  ) {
    throw new Error("Website structured data is missing its graph.");
  }
  const graph: unknown[] = schema["@graph"];
  return {
    ...schema,
    "@graph": graph.map((entry: unknown) => {
      if (!entry || typeof entry !== "object" || !("@type" in entry)) {
        throw new Error("Invalid structured data entry.");
      }
      if (entry["@type"] === "WebSite") {
        return {
          ...entry,
          description: resolveMessage(copy, "metadata.websiteDescription"),
          inLanguage: language,
          url: canonicalUrl(base, language),
        };
      }
      if (entry["@type"] === "SoftwareApplication") {
        return {
          ...entry,
          description: resolveMessage(copy, "metadata.productDescription"),
          ...("image" in entry
            ? { image: resolveMessage(copy, "metadata.socialImage") }
            : {}),
          url: canonicalUrl("https://kurobara.systems/kurobara/", language),
        };
      }
      return entry;
    }),
  };
};

export const localizeMetadata = (
  html: string,
  language: Language,
  base: string,
  copy: unknown
): string => {
  const canonical = canonicalUrl(base, language);
  return html
    .replace(MANIFEST_TAG, (tag) =>
      replaceAttribute(tag, "href", manifestUrl(base, language))
    )
    .replace(CANONICAL_TAG, (tag) => replaceAttribute(tag, "href", canonical))
    .replace(OG_URL_TAG, (tag) => replaceAttribute(tag, "content", canonical))
    .replace(
      SCHEMA_TAG,
      (_match, opening: string, json: string, closing: string) =>
        `${opening}\n${JSON.stringify(localizedSchema(JSON.parse(json), language, base, copy), null, 2)}\n${closing}`
    );
};

export const updateLanguageLinks = (language: Language): void => {
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
    "a[data-language]"
  )) {
    const target = anchor.dataset.language;
    if (target !== "en" && target !== "fr") {
      continue;
    }
    anchor.href = `${window.location.pathname}${languageSearch(window.location.search, target)}${window.location.hash}`;
    anchor.setAttribute("aria-current", String(target === language));
  }
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
    "a[data-site-link]"
  )) {
    anchor.href = localizedSiteUrl(anchor.dataset.siteLink ?? "/", language);
  }
};

export const applyTranslations = (copy: unknown, language: Language): void => {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    element.textContent = resolveMessage(copy, element.dataset.i18n ?? "");
  }
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-i18n-label]"
  )) {
    element.setAttribute(
      "aria-label",
      resolveMessage(copy, element.dataset.i18nLabel ?? "")
    );
  }
  for (const element of document.querySelectorAll<HTMLMetaElement>(
    "[data-i18n-content]"
  )) {
    element.content = resolveMessage(copy, element.dataset.i18nContent ?? "");
  }
  updateLanguageLinks(language);
};

export const applyMetadata = (
  language: Language,
  base: string,
  copy: unknown
): void => {
  const canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  const ogUrl = document.querySelector<HTMLMetaElement>(
    'meta[property="og:url"]'
  );
  const manifest = document.querySelector<HTMLLinkElement>(
    'link[rel="manifest"]'
  );
  if (manifest) {
    manifest.href = manifestUrl(base, language);
  }
  if (canonical) {
    canonical.href = canonicalUrl(base, language);
  }
  if (ogUrl) {
    ogUrl.content = canonicalUrl(base, language);
  }
  const script = document.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"]'
  );
  if (script?.textContent) {
    script.textContent = JSON.stringify(
      localizedSchema(JSON.parse(script.textContent), language, base, copy)
    );
  }
};
