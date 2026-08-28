import assert from "node:assert/strict";
import test from "node:test";

import { defineConfig } from "./index.js";

test("recommended config enables the conservative quality baseline", () => {
  const config = defineConfig();

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

test("strict config prevents duplicate assertion diagnostics", () => {
  const config = defineConfig({ presets: ["type-safety", "strict"] });

  assert.equal(config.rules?.["quality/no-type-assertions"], "error");
  assert.equal(
    config.rules?.["quality/require-safety-comment-for-type-assertion"],
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
  assert.ok("effecttsgo/floating-effect" in (config.rules ?? {}));
});
