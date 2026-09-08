import assert from "node:assert/strict";
import test from "node:test";

import { defineConfig } from "./index.js";

test("default config enables every quality preset", () => {
  const config = defineConfig();

  assert.equal(config.options?.typeAware, true);
  assert.equal(config.rules?.["quality/no-shape-in-symbol-names"], "error");
  assert.equal(config.rules?.["quality/no-known-value-widening"], "error");
  assert.equal(config.rules?.["quality/no-runtime-typeof"], "error");
  assert.equal(config.rules?.["quality/no-module-mocking"], "error");
  assert.equal(config.rules?.["quality/no-exported-types"], "error");
  assert.equal(config.rules?.["react/no-array-index-key"], "error");
  assert.equal(
    config.rules?.["effecttsgo/any-unknown-in-error-context"],
    "warn",
  );
  assert.equal(config.rules?.["effecttsgo/floating-effect"], "error");
  assert.equal(config.rules?.["quality/no-type-assertions"], "error");
});

test("recommended config remains available as a conservative opt-down", () => {
  const config = defineConfig({ presets: ["recommended"] });

  assert.deepEqual(config.jsPlugins, [
    { name: "quality", specifier: "@dakdevs/oxlint-plugin" },
  ]);
  assert.equal(config.categories?.correctness, "error");
  assert.deepEqual(config.rules?.complexity, ["error", { max: 12 }]);
  assert.equal(
    config.rules?.["quality/no-conditional-empty-object-spread"],
    "error",
  );
  assert.equal(config.rules?.["quality/no-shape-in-symbol-names"], "error");
  assert.equal(config.rules?.["quality/no-type-assertions"], undefined);
});

test("core config requires explicit control-flow and return bodies", () => {
  const config = defineConfig({ presets: ["core"] });

  assert.deepEqual(config.rules?.["arrow-body-style"], ["error", "always"]);
  assert.deepEqual(config.rules?.curly, ["error", "all"]);
});

test("strict config prevents duplicate assertion diagnostics", () => {
  const config = defineConfig({ presets: ["type-safety", "strict"] });

  assert.equal(config.rules?.["quality/no-type-assertions"], "error");
  assert.equal(
    config.rules?.["quality/require-safety-comment-for-type-assertion"],
    "off",
  );
});

test("default and Effect presets do not reject required arrow blocks", () => {
  const configs = [
    defineConfig(),
    defineConfig({ presets: ["all"] }),
    defineConfig({ presets: ["core", "effect"] }),
  ];

  for (const config of configs) {
    assert.deepEqual(config.rules?.["arrow-body-style"], ["error", "always"]);
    assert.equal(config.rules?.["effecttsgo/unnecessary-arrow-block"], "off");
    assert.equal(config.rules?.["effecttsgo/floating-effect"], "error");
  }

  assert.equal(
    defineConfig({ presets: ["effect"] }).rules?.["effecttsgo/unnecessary-arrow-block"],
    "off",
  );
});

test("local configuration overrides selected presets", () => {
  const config = defineConfig({
    presets: ["boundaries"],
    rules: {
      "quality/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
    },
  });

  assert.deepEqual(config.rules?.["quality/no-runtime-typeof"], [
    "error",
    { allowInTypeGuards: true },
  ]);
});

test("react-next config chooses the stricter adopted conflicts", () => {
  const config = defineConfig({ presets: ["react-next"] });

  assert.equal(config.rules?.["jsx-a11y/no-autofocus"], "error");
  assert.equal(config.rules?.["nextjs/no-html-link-for-pages"], "error");
});

test("effect config composes type-aware and Effect presets", () => {
  const config = defineConfig({ presets: ["effect"] });

  assert.equal(config.options?.typeAware, true);
  assert.equal(config.rules?.["typescript/no-unsafe-assignment"], "error");
  assert.ok(config.plugins?.join(",").includes("effecttsgo"));
  assert.equal(
    config.rules?.["effecttsgo/any-unknown-in-error-context"],
    "warn",
  );
  assert.equal(config.rules?.["effecttsgo/floating-effect"], "error");
});
