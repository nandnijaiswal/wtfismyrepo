import { test } from "node:test";
import assert from "node:assert/strict";
import { buildADHDContext } from "../src/explain.mjs";
import { selectOnboardingFrames, ONBOARDING_FRAMES } from "../src/onboarding-frames.mjs";

const MOCK_ANALYSIS = {
  cwd: "/repo/myapp",
  pkg: { name: "myapp", description: "a test app", scripts: ["start", "test"] },
  stack: { languages: ["JavaScript/TypeScript"] },
  hasReadme: true,
  counts: { files: 50, sourceFiles: 30, edges: 80 },
  topLevel: [{ dir: "src", count: 30 }, { dir: "test", count: 10 }],
  entryPoints: [{ file: "src/index.ts", weight: 6, why: "package.json main" }],
  importance: [
    { file: "src/core.ts", score: 1.0, rank: 0.4 },
    { file: "src/router.ts", score: 0.8, rank: 0.3 },
  ],
  fragility: [{ file: "src/core.ts", score: 0.9, centrality: 1.0, churn: 8 }],
  hotZones: [{ file: "src/auth.ts", prs: [12, 13] }],
  history: {
    available: true,
    openIssues: [{ number: 1, title: "Fix login bug" }],
    goodFirstIssues: [{ number: 2, title: "Add dark mode" }],
    openPRs: [],
    mergedPRs: [],
  },
};

test("buildADHDContext produces a non-empty problem and context", () => {
  const { problem, context } = buildADHDContext(MOCK_ANALYSIS);
  assert.ok(problem.includes("myapp"), "problem should mention the repo name");
  assert.ok(context.includes("src/core.ts"), "context should reference the spine file");
  assert.ok(context.includes("src/auth.ts"), "context should reference hot zones");
  assert.ok(context.includes("Add dark mode"), "context should list good first issues");
});

test("buildADHDContext includes developer profile when provided", () => {
  const { problem } = buildADHDContext(MOCK_ANALYSIS, {
    experience: "new-grad",
    goal: "fix a bug",
  });
  assert.ok(problem.includes("new-grad"));
  assert.ok(problem.includes("fix a bug"));
});

test("selectOnboardingFrames returns exactly N frames", () => {
  for (const n of [3, 5, 7]) {
    const frames = selectOnboardingFrames(n);
    assert.equal(frames.length, n, `expected ${n} frames`);
  }
});

test("selectOnboardingFrames always includes at least one wild frame", () => {
  for (let i = 0; i < 10; i++) {
    const frames = selectOnboardingFrames(5);
    const hasWild = frames.some((f) => f.tags.includes("wild"));
    assert.ok(hasWild, "should always include a wild frame");
  }
});

test("all frame ids are unique", () => {
  const ids = ONBOARDING_FRAMES.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate frame ids detected");
});
