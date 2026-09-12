import "./styles.css";
import {
  type Language,
  languageSearch,
  readLanguage,
  translations,
} from "./i18n";
import {
  applyMetadata,
  applyTranslations,
  updateLanguageLinks,
} from "./localization";
import {
  isPerspective,
  isView,
  legacyProductHref,
  type Perspective,
  type Route,
  readRoute,
  routeHash,
  type View,
} from "./navigation";
import {
  isWorkflowStage,
  registerWebsiteWebMcp,
  type WorkflowStage,
} from "./webmcp";

const requireElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing website element: ${selector}`);
  }
  return element;
};

const { body } = document;
const roseStage = requireElement<HTMLElement>("[data-rose-stage]");
const previewPanel = requireElement<HTMLElement>("[data-preview-panel]");
const previewTitle = requireElement<HTMLElement>("[data-preview-title]");
const previewDescription = requireElement<HTMLElement>(
  "[data-preview-description]"
);
const previewLink = requireElement<HTMLAnchorElement>("[data-preview-link]");
const menu = requireElement<HTMLElement>("#rose-menu");
const openRose = requireElement<HTMLButtonElement>("[data-open-rose]");
const backLink = requireElement<HTMLAnchorElement>("[data-back]");
const contactLink = requireElement<HTMLAnchorElement>("[data-header-contact]");
const contactClose = requireElement<HTMLAnchorElement>("[data-close-contact]");
const home = requireElement<HTMLElement>('[data-page="accueil"]');
const pages = document.querySelectorAll<HTMLElement>("[data-page]");
const mobileQuery = window.matchMedia("(max-width: 900px)");
const petalNav = requireElement<HTMLElement>(".petal-navigation");

let language = readLanguage(window.location.search);
let copy = translations[language];
let selectedWorkflow: WorkflowStage | null = null;

let route = readRoute(window.location.hash);
let preview: Perspective | null = null;
let menuSelection: Perspective | null = "produits";
let contactOrigin: Route = { menu: false, view: "accueil" };
let contactInvoker: HTMLElement | null = null;
let homeInvoker: HTMLElement | null = null;
let leaveTimer: number | undefined;
let animationFrame: number | undefined;

const setPreview = (selection: Perspective | null) => {
  preview = selection;
  body.dataset.previewing = selection ?? "";
  previewPanel.hidden =
    !selection || route.view !== "accueil" || route.menu || mobileQuery.matches;
  if (!selection) {
    return;
  }
  const content = copy.perspectives[selection];
  previewTitle.textContent = content.title;
  previewDescription.textContent = content.description;
  previewLink.href = `#${selection}`;
  requireElement<HTMLElement>("[data-preview-link] span").textContent =
    content.action;
};

const renderMenu = () => {
  for (const control of document.querySelectorAll<HTMLButtonElement>(
    "[data-menu-choice]"
  )) {
    const selected = control.dataset.menuChoice === menuSelection;
    control.setAttribute("aria-expanded", String(selected));
    const detail = document.getElementById(
      control.getAttribute("aria-controls") ?? ""
    );
    if (detail) {
      detail.hidden = !selected;
    }
    const arrow = control.querySelector("use");
    arrow?.setAttribute("href", selected ? "#minus" : "#arrow-right");
    control.classList.toggle("is-selected", selected);
  }
  setPreview(route.menu ? menuSelection : null);
};

const focusDestination = (previousView: View, next: Route) => {
  window.scrollTo({ behavior: "instant", top: 0 });
  if (
    previousView === "contact" &&
    contactInvoker &&
    !contactInvoker.closest("[hidden]")
  ) {
    contactInvoker.focus({ preventScroll: true });
  } else if (next.menu) {
    menu
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
  } else if (next.view === "accueil") {
    if (
      homeInvoker &&
      !homeInvoker.closest("[hidden]") &&
      homeInvoker.getClientRects().length > 0
    ) {
      homeInvoker.focus({ preventScroll: true });
    } else if (openRose.getClientRects().length > 0) {
      openRose.focus({ preventScroll: true });
    } else {
      requireElement<HTMLAnchorElement>(".brand").focus({
        preventScroll: true,
      });
    }
  } else {
    document
      .querySelector<HTMLElement>(`[data-page="${next.view}"] h2`)
      ?.focus({ preventScroll: true });
  }
};

const render = (requested: Route, focusContent: boolean) => {
  const next =
    requested.menu && !mobileQuery.matches
      ? { menu: false, view: "accueil" as const }
      : requested;
  const previousView = route.view;
  route = next;
  window.clearTimeout(leaveTimer);
  if (animationFrame !== undefined) {
    window.cancelAnimationFrame(animationFrame);
  }
  body.dataset.view = next.view;
  body.dataset.menuOpen = String(next.menu);
  setPreview(null);
  for (const page of pages) {
    const active = page.dataset.page === next.view && !next.menu;
    page.hidden = !active;
    page.classList.remove("is-entering");
    if (active && next.view !== "accueil" && focusContent) {
      animationFrame = window.requestAnimationFrame(() =>
        page.classList.add("is-entering")
      );
    }
  }
  home.hidden = next.view !== "accueil" || next.menu;
  menu.hidden = !next.menu;
  openRose.setAttribute("aria-expanded", String(next.menu));
  petalNav.hidden = next.view !== "accueil" || next.menu;
  backLink.hidden = next.view === "accueil";
  const backText = backLink.querySelector("span");
  if (backText) {
    backText.textContent =
      next.view === "contact"
        ? copy.navigation.back
        : copy.navigation.backToRose;
  }
  contactLink.hidden = next.view === "contact";
  contactClose.hidden = next.view !== "contact";
  document.title = copy.titles[next.view];
  updateLanguageLinks(language);
  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    ".site-nav a, .petal-navigation a"
  )) {
    if (link.hash === `#${next.view}`) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
  if (next.menu) {
    renderMenu();
  }
  if (!focusContent) {
    return;
  }
  focusDestination(previousView, next);
};

const navigate = (next: Route, trigger?: HTMLElement) => {
  if (routeHash(next) === routeHash(route)) {
    return;
  }
  if (next.view === "contact") {
    contactOrigin = route;
    contactInvoker =
      trigger ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
  }
  if (route.view === "accueil" && !route.menu && trigger) {
    homeInvoker = trigger;
  }
  window.history.pushState(
    { contact: next.view === "contact", eclosion: true },
    "",
    routeHash(next)
  );
  render(next, true);
};

const closeContact = () => {
  const state: unknown = window.history.state;
  if (
    typeof state === "object" &&
    state !== null &&
    "eclosion" in state &&
    state.eclosion === true &&
    "contact" in state &&
    state.contact === true
  ) {
    window.history.back();
  } else {
    navigate(contactOrigin);
  }
};

for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
  'a[href^="#"]'
)) {
  anchor.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0 ||
      anchor.hash === "#main"
    ) {
      return;
    }
    const target = anchor.hash.slice(1);
    if (!isView(target)) {
      return;
    }
    event.preventDefault();
    if (
      anchor === contactClose ||
      (anchor === backLink && route.view === "contact")
    ) {
      closeContact();
    } else {
      navigate({ menu: false, view: target }, anchor);
    }
  });
}

const applyLanguage = (next: Language) => {
  language = next;
  copy = translations[language];
  applyTranslations(copy, language);
  applyMetadata(language, "https://kurobara.systems/", copy);
  document.title = copy.titles[route.view];
  const backText = backLink.querySelector("span");
  if (backText) {
    backText.textContent =
      route.view === "contact"
        ? copy.navigation.back
        : copy.navigation.backToRose;
  }
  if (selectedWorkflow) {
    requireElement<HTMLElement>("[data-stage-status]").textContent =
      copy.workflow[selectedWorkflow];
  }
  if (route.menu) {
    renderMenu();
  } else {
    setPreview(preview);
  }
};
for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
  "a[data-language]"
)) {
  anchor.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    const next = anchor.dataset.language;
    if (next !== "en" && next !== "fr") {
      return;
    }
    event.preventDefault();
    if (next === language) {
      return;
    }
    window.history.pushState(
      { eclosion: true },
      "",
      `${window.location.pathname}${languageSearch(window.location.search, next)}${window.location.hash}`
    );
    applyLanguage(next);
  });
}
window.addEventListener("popstate", () => {
  applyLanguage(readLanguage(window.location.search));
  render(readRoute(window.location.hash), true);
});
window.addEventListener("hashchange", () => {
  const next = readRoute(window.location.hash);
  if (
    routeHash(next) !== routeHash(route) &&
    window.location.hash !== "#main"
  ) {
    render(next, true);
  }
});

for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
  "[data-preview]"
)) {
  const select = () => {
    const selection = anchor.dataset.preview;
    if (route.view === "accueil" && !route.menu && isPerspective(selection)) {
      window.clearTimeout(leaveTimer);
      setPreview(selection);
    }
  };
  anchor.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") {
      select();
    }
  });
  anchor.addEventListener("focus", select);
}

const petalSelection = (target: EventTarget | null): Perspective | null => {
  if (!(target instanceof Element)) {
    return null;
  }
  for (const selection of ["produits", "expertises", "studio"] as const) {
    if (target.classList.contains(`petal-${selection}`)) {
      return selection;
    }
  }
  return null;
};
roseStage.addEventListener("pointerover", (event) => {
  if (event.pointerType === "touch" || route.view !== "accueil" || route.menu) {
    return;
  }
  const selection = petalSelection(event.target);
  if (selection) {
    window.clearTimeout(leaveTimer);
    setPreview(selection);
  }
});
roseStage.addEventListener("click", (event) => {
  if (route.view !== "accueil" || mobileQuery.matches || route.menu) {
    return;
  }
  const selection = petalSelection(event.target);
  if (selection) {
    navigate({ menu: false, view: selection });
  }
});
roseStage.addEventListener("pointerenter", () =>
  window.clearTimeout(leaveTimer)
);
roseStage.addEventListener("pointerleave", () => {
  if (!(route.menu || roseStage.contains(document.activeElement))) {
    leaveTimer = window.setTimeout(() => setPreview(null), 180);
  }
});

openRose.addEventListener("click", () =>
  navigate({ menu: true, view: "accueil" }, openRose)
);
requireElement<HTMLButtonElement>("[data-close-rose]").addEventListener(
  "click",
  () => navigate({ menu: false, view: "accueil" })
);
requireElement<HTMLButtonElement>("[data-explore]").addEventListener(
  "click",
  () => {
    requireElement<HTMLAnchorElement>('[data-preview="produits"]').focus();
    setPreview("produits");
  }
);
for (const control of document.querySelectorAll<HTMLButtonElement>(
  "[data-menu-choice]"
)) {
  control.addEventListener("click", () => {
    const choice = control.dataset.menuChoice;
    if (isPerspective(choice)) {
      menuSelection = menuSelection === choice ? null : choice;
      renderMenu();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (route.view === "contact") {
    closeContact();
  } else if (route.menu || route.view !== "accueil") {
    navigate({ menu: false, view: "accueil" });
  } else if (preview) {
    setPreview(null);
    requireElement<HTMLAnchorElement>(".brand").focus();
  }
});
mobileQuery.addEventListener("change", () => {
  if (!mobileQuery.matches && route.menu) {
    window.history.replaceState({ eclosion: true }, "", "#accueil");
    render({ menu: false, view: "accueil" }, true);
  } else {
    setPreview(null);
  }
});

const selectWorkflowStage = (stage: WorkflowStage) => {
  if (route.view !== "produits") {
    navigate({ menu: false, view: "produits" });
  }
  const detail = requireElement<HTMLElement>("[data-stage-status]");
  detail.hidden = false;
  selectedWorkflow = stage;
  detail.textContent = copy.workflow[stage];
  for (const control of document.querySelectorAll<HTMLButtonElement>(
    "[data-stage-control]"
  )) {
    control.setAttribute(
      "aria-pressed",
      String(control.dataset.stageControl === stage)
    );
  }
};
for (const control of document.querySelectorAll<HTMLButtonElement>(
  "[data-stage-control]"
)) {
  control.addEventListener("click", () => {
    const stage = control.dataset.stageControl;
    if (isWorkflowStage(stage)) {
      selectWorkflowStage(stage);
    }
  });
}
const quickstartCommands = [
  "git clone https://github.com/Dragon-kanji/Kurobara.git",
  "cd Kurobara",
  "npm ci",
  "npm run self-host:smoke",
].join("\n");
let webMcpController: AbortController | undefined;
registerWebsiteWebMcp(document, {
  getQuickstartCommands: () => quickstartCommands,
  selectWorkflowStage,
})
  .then((controller) => {
    webMcpController = controller;
  })
  .catch(() => undefined);
window.addEventListener("pagehide", (event) => {
  window.clearTimeout(leaveTimer);
  if (animationFrame !== undefined) {
    window.cancelAnimationFrame(animationFrame);
  }
  if (!event.persisted) {
    webMcpController?.abort();
  }
});

applyLanguage(language);
body.classList.add("is-enhanced");
render(route, false);
const legacyHref = legacyProductHref(
  window.location.hash,
  window.location.search
);
if (legacyHref) {
  window.location.replace(legacyHref);
}
