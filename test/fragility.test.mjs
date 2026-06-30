import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreFiles } from "../src/fragility.mjs";
import { detectStack } from "../src/detect.mjs";
import { detectEntryPoints } from "../src/entrypoints.mjs";

test("importance is sorted by centrality desc", () => {
  const rank = new Map([["a", 0.1], ["b", 0.5], ["c", 0.3]]);
  const churn = new Map();
  const { importance } = scoreFiles(rank, churn);
  assert.deepEqual(importance.map((x) => x.file), ["b", "c", "a"]);
});

test("fragility = central AND churned", () => {
  const rank = new Map([["central", 1.0], ["quiet", 1.0], ["churned", 0.0]]);
  const churn = new Map([["central", 10], ["quiet", 0], ["churned", 10]]);
  const { fragility } = scoreFiles(rank, churn);
  // 'central' has both high centrality and high churn -> ranks first.
  assert.equal(fragility[0].file, "central");
  // 'churned' has churn but zero centrality -> filtered out (score 0).
  assert.ok(!fragility.find((f) => f.file === "churned"));
});

test("detectStack reads manifests via predicate", () => {
  const exists = (f) => f === "package.json";
  const s = detectStack(exists);
  assert.deepEqual(s.languages, ["JavaScript/TypeScript"]);
  assert.deepEqual(s.ecosystems, ["node"]);
});

test("detectEntryPoints prefers package.json bin/main then conventions", () => {
  const files = ["src/index.ts", "bin/cli.mjs", "src/main.ts"];
  const eps = detectEntryPoints(files, { bin: { tool: "bin/cli.mjs" } });
  assert.equal(eps[0].file, "bin/cli.mjs");
  assert.ok(eps.some((e) => e.file === "src/main.ts"));
});
