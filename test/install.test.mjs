import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { installSkill } from "../src/install.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "wtf-install-"));
}

test("project install writes SKILL.md to .claude/skills", () => {
  const cwd = tmpDir();
  const res = installSkill({ target: "project", cwd });
  assert.equal(res.installed, true);
  const expected = path.join(cwd, ".claude", "skills", "wtfismyrepo", "SKILL.md");
  assert.equal(res.dest, expected);
  assert.ok(fs.existsSync(expected));
  assert.ok(fs.readFileSync(expected, "utf8").includes("wtfismyrepo"));
});

test("second install is a no-op without --force", () => {
  const cwd = tmpDir();
  installSkill({ target: "project", cwd });
  const res = installSkill({ target: "project", cwd });
  assert.equal(res.installed, false);
  assert.match(res.message, /already installed/);
});

test("--force overwrites an existing install", () => {
  const cwd = tmpDir();
  installSkill({ target: "project", cwd });
  const res = installSkill({ target: "project", cwd, force: true });
  assert.equal(res.installed, true);
});
