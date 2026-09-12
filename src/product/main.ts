import "@fontsource/bebas-neue/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import { type Language, languageSearch, readLanguage } from "../i18n";
import {
  applyMetadata,
  applyTranslations,
  resolveMessage,
  updateLanguageLinks,
} from "../localization";
import "./styles.css";
import { productCopy } from "./i18n";

const PRODUCT_CANONICAL_BASE = "https://kurobara.systems/kurobara/";

type WorkflowStage = keyof (typeof productCopy)["en"]["stages"];

const isLanguage = (value: string | undefined): value is Language =>
  value === "en" || value === "fr";

const isWorkflowStage = (value: string | undefined): value is WorkflowStage =>
  value === "discover" ||
  value === "shortlist" ||
  value === "enrich" ||
  value === "verify" ||
  value === "export";

let activeLanguage = readLanguage(window.location.search);
let activeStage: WorkflowStage = "discover";

const menuToggle =
  document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const menu = document.querySelector<HTMLElement>("[data-menu]");

const closeMenu = () => {
  menuToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
};

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  document.body.classList.toggle("menu-open", !isOpen);
});

menu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

const stageControls = document.querySelectorAll<HTMLButtonElement>(
  "[data-stage-control]"
);
const stages = document.querySelectorAll<HTMLElement>("[data-stage]");
const stageStreams = document.querySelectorAll<HTMLElement>(
  "[data-stream-stage]"
);
const stageStatus = document.querySelector<HTMLElement>("[data-stage-status]");

const selectWorkflowStage = (selectedStage: WorkflowStage) => {
  activeStage = selectedStage;

  for (const candidate of stageControls) {
    const isSelected = candidate.dataset.stageControl === selectedStage;
    candidate.classList.toggle("is-active", isSelected);
    candidate.setAttribute("aria-pressed", String(isSelected));
  }

  for (const stage of stages) {
    stage.classList.toggle("is-active", stage.dataset.stage === selectedStage);
  }

  for (const stream of stageStreams) {
    stream.classList.toggle(
      "is-active",
      stream.dataset.streamStage === selectedStage
    );
  }

  if (stageStatus) {
    stageStatus.textContent = resolveMessage(
      productCopy[activeLanguage],
      `status.stage.${selectedStage}`
    );
  }
};

for (const control of stageControls) {
  control.addEventListener("click", () => {
    const selectedStage = control.dataset.stageControl;
    if (isWorkflowStage(selectedStage)) {
      selectWorkflowStage(selectedStage);
    }
  });
}

const applyLanguage = (language: Language, historyMode: "none" | "push") => {
  if (historyMode === "push") {
    const nextUrl = `${window.location.pathname}${languageSearch(
      window.location.search,
      language
    )}${window.location.hash}`;
    window.history.pushState(null, "", nextUrl);
  }

  activeLanguage = language;
  applyTranslations(productCopy[language], language);
  applyMetadata(language, PRODUCT_CANONICAL_BASE, productCopy[language]);
  updateLanguageLinks(language);
  selectWorkflowStage(activeStage);
};

const languageLinks =
  document.querySelectorAll<HTMLAnchorElement>("[data-language]");

for (const link of languageLinks) {
  link.addEventListener("click", (event) => {
    const { language } = link.dataset;
    if (
      !isLanguage(language) ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (language === activeLanguage) {
      return;
    }
    applyLanguage(language, "push");
  });
}

window.addEventListener("popstate", () => {
  applyLanguage(readLanguage(window.location.search), "none");
});

window.addEventListener("hashchange", () => {
  updateLanguageLinks(activeLanguage);
});

const copyButton = document.querySelector<HTMLButtonElement>(
  "[data-copy-command]"
);
const copyLabel = document.querySelector<HTMLElement>("[data-copy-label]");

const setCopyLabel = (key: keyof (typeof productCopy)["en"]["status"]) => {
  if (copyLabel) {
    copyLabel.textContent = resolveMessage(
      productCopy[activeLanguage],
      `status.${key}`
    );
  }
};

copyButton?.addEventListener("click", async () => {
  const command = copyButton.dataset.copyText;
  if (!command) {
    return;
  }

  try {
    await navigator.clipboard.writeText(command);
    setCopyLabel("copied");
    window.setTimeout(() => {
      setCopyLabel("copyDefault");
    }, 1800);
  } catch {
    setCopyLabel("copyError");
  }
});

const revealTargets = document.querySelectorAll<HTMLElement>(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  for (const target of revealTargets) {
    observer.observe(target);
  }
} else {
  for (const target of revealTargets) {
    target.classList.add("is-visible");
  }
}

const year = document.querySelector<HTMLElement>("[data-year]");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

applyLanguage(activeLanguage, "none");
