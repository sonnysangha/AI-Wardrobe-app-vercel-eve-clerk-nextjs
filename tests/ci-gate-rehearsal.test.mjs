import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Temporary gate demonstration only. This pull request must remain unmerged.
test("deliberate CI gate rehearsal: Node requirement", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(manifest.engines.node, ">=24", "Corrected expectation restores the passing required check");
});
