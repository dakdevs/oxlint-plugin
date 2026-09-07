import assert from "node:assert/strict";
import test from "node:test";

import plugin, { ruleCatalog } from "./index.js";

const expectedRuleNames = [
  "extensionless-relative-code-imports",
  "no-chained-type-assertions",
  "no-conditional-empty-object-spread",
  "no-exported-types",
  "no-generic-record-guard",
  "no-known-value-widening",
  "no-module-mocking",
  "no-object-parameters",
  "no-reflect-apply",
  "no-reflect-get",
  "no-runtime-typeof",
  "no-shape-in-symbol-names",
  "no-type-assertions",
  "no-unjustified-type-predicate",
  "no-unknown-parameters",
  "no-unknown-returns",
  "no-unknown-type-aliases",
  "no-unsafe-dictionary-type",
  "no-widen-then-assert",
  "padding-line-between-statements",
  "require-safety-comment-for-type-assertion",
];

test("quality plugin exposes every adopted custom rule", () => {
  assert.deepEqual(Object.keys(plugin.rules).sort(), expectedRuleNames);
  assert.ok(plugin.meta);
  assert.equal(plugin.meta.name, "quality");
  assert.deepEqual(Object.keys(ruleCatalog).sort(), expectedRuleNames);
});
