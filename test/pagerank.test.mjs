import { test } from "node:test";
import assert from "node:assert/strict";
import { pageRank } from "../src/pagerank.mjs";

test("ranks sum to ~1", () => {
  const g = new Map([
    ["a", new Set(["b", "c"])],
    ["b", new Set(["c"])],
    ["c", new Set(["a"])],
  ]);
  const r = pageRank(g);
  const sum = [...r.values()].reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-6, `sum was ${sum}`);
});

test("the most-depended-on node ranks highest", () => {
  // Everyone imports 'core'; core imports nothing.
  const g = new Map([
    ["a", new Set(["core"])],
    ["b", new Set(["core"])],
    ["d", new Set(["core"])],
    ["core", new Set()],
  ]);
  const r = pageRank(g);
  const sorted = [...r].sort((x, y) => y[1] - x[1]);
  assert.equal(sorted[0][0], "core");
});

test("empty graph yields empty ranks", () => {
  assert.equal(pageRank(new Map()).size, 0);
});

test("dangling nodes do not leak rank (still sums to 1)", () => {
  const g = new Map([
    ["a", new Set(["b"])],
    ["b", new Set()], // dangling
  ]);
  const r = pageRank(g);
  const sum = [...r.values()].reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-6);
});

test("target-only nodes are included in the ranking", () => {
  const g = new Map([["a", new Set(["b"])]]); // b never a key
  const r = pageRank(g);
  assert.ok(r.has("b"));
});
