import assert from "node:assert/strict";
import test from "node:test";
import { readRoute, routeHash, VIEWS } from "../src/navigation.ts";

test("every destination survives copying and reopening its fragment", () => {
  for (const view of VIEWS) {
    const route = { menu: false, view };
    assert.deepEqual(readRoute(routeHash(route)), route);
  }
  const menu = { menu: true, view: "accueil" };
  assert.deepEqual(readRoute(routeHash(menu)), menu);
});

test("old product anchors still resolve to the product and unknown input stays local", () => {
  for (const hash of ["#workflow", "#contracts", "#quickstart"]) {
    assert.deepEqual(readRoute(hash), { menu: false, view: "produits" });
  }
  for (const hash of [
    "",
    "#top",
    "#missing",
    "#https://example.com",
    "#%3Cscript%3E",
    "#__proto__",
  ]) {
    assert.deepEqual(readRoute(hash), { menu: false, view: "accueil" });
  }
});
