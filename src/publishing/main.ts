import { type Language, languageSearch, readLanguage } from "../i18n";
import { applyMetadata, applyTranslations } from "../localization";
import { publishingCopy } from "./i18n";
import "./styles.css";

const BASE = "https://kurobara.systems/publishing/";
let activeLanguage = readLanguage(window.location.search);

const applyLanguage = (language: Language, push: boolean) => {
  if (push) {
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${languageSearch(window.location.search, language)}${window.location.hash}`
    );
  }
  activeLanguage = language;
  applyTranslations(publishingCopy[language], language);
  applyMetadata(language, BASE, publishingCopy[language]);
};

for (const link of document.querySelectorAll<HTMLAnchorElement>(
  "[data-language]"
)) {
  link.addEventListener("click", (event) => {
    const { language } = link.dataset;
    if (
      (language !== "en" && language !== "fr") ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    if (language !== activeLanguage) {
      applyLanguage(language, true);
    }
  });
}

window.addEventListener("popstate", () => {
  applyLanguage(readLanguage(window.location.search), false);
});
window.addEventListener("hashchange", () => {
  applyLanguage(activeLanguage, false);
});

applyLanguage(activeLanguage, false);
