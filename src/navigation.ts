export const VIEWS = [
  "accueil",
  "produits",
  "expertises",
  "studio",
  "contact",
] as const;
export type View = (typeof VIEWS)[number];
export type Perspective = Exclude<View, "accueil" | "contact">;

export interface Route {
  readonly menu: boolean;
  readonly view: View;
}

export const isView = (value: unknown): value is View =>
  typeof value === "string" && VIEWS.some((view) => view === value);

export const isPerspective = (value: unknown): value is Perspective =>
  value === "produits" || value === "expertises" || value === "studio";

export const readRoute = (hash: string): Route => {
  const name = hash.startsWith("#") ? hash.slice(1) : hash;
  if (name === "explorer") {
    return { menu: true, view: "accueil" };
  }
  if (["workflow", "contracts", "quickstart"].includes(name)) {
    return { menu: false, view: "produits" };
  }
  return { menu: false, view: isView(name) ? name : "accueil" };
};

export const routeHash = (route: Route): string =>
  route.menu ? "#explorer" : `#${route.view}`;

export const legacyProductHref = (
  hash: string,
  search: string
): string | null =>
  ["#workflow", "#contracts", "#quickstart"].includes(hash)
    ? `/kurobara/${search}${hash}`
    : null;
