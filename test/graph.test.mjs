import { test } from "node:test";
import assert from "node:assert/strict";
import { extractImports, resolveImport, buildGraph } from "../src/graph.mjs";

test("extracts JS/TS import forms", () => {
  const src = `
    import a from './a';
    import { b } from "../lib/b";
    export { c } from './c';
    const d = require('./d');
    const e = await import('./e');
    import 'side-effect';
  `;
  const specs = extractImports(src, ".ts");
  assert.ok(specs.includes("./a"));
  assert.ok(specs.includes("../lib/b"));
  assert.ok(specs.includes("./c"));
  assert.ok(specs.includes("./d"));
  assert.ok(specs.includes("./e"));
  assert.ok(specs.includes("side-effect"));
});

test("extracts python imports", () => {
  const src = "from .models import User\nimport os\nfrom ..core.db import conn";
  const specs = extractImports(src, ".py");
  assert.ok(specs.includes(".models"));
  assert.ok(specs.includes("..core.db"));
});

test("resolveImport maps relative JS to a real file", () => {
  const files = new Set(["src/a.ts", "src/lib/b.ts", "src/index.ts"]);
  assert.equal(resolveImport("./lib/b", "src/a.ts", files, ".ts"), "src/lib/b.ts");
  assert.equal(resolveImport("react", "src/a.ts", files, ".ts"), null); // external
});

test("resolveImport handles index resolution", () => {
  const files = new Set(["src/a.ts", "src/lib/index.ts"]);
  assert.equal(resolveImport("./lib", "src/a.ts", files, ".ts"), "src/lib/index.ts");
});

test("buildGraph wires internal edges only", () => {
  const contents = new Map([
    ["src/index.ts", "import { x } from './core'; import _ from 'lodash';"],
    ["src/core.ts", "export const x = 1;"],
  ]);
  const g = buildGraph(contents);
  assert.deepEqual([...g.get("src/index.ts")], ["src/core.ts"]);
  assert.equal(g.get("src/core.ts").size, 0);
});
