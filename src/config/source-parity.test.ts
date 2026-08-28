import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import plugin from "../index.js";
import { defineConfig } from "./index.js";

type JsonObject = { readonly [key: string]: unknown };

const fixtureNames = ["dak-dev", "itstechnight", "openfactory"] as const;
const customNamespaces = [
  "anti-slop/",
  "boundaries/",
  "type-discipline/",
] as const;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fixtureRules(name: (typeof fixtureNames)[number]): Promise<JsonObject> {
  const url = new URL(
    `../../test/fixtures/source-configs/${name}.oxlintrc.json`,
    import.meta.url,
  );
  const parsed: unknown = JSON.parse(await readFile(url, "utf8"));
  assert.ok(isJsonObject(parsed));
  assert.ok(isJsonObject(parsed.rules));
  return parsed.rules;
}

function normalizedCustomRuleName(ruleName: string): string | null {
  const namespace = customNamespaces.find((prefix) => ruleName.startsWith(prefix));
  return namespace === undefined ? null : ruleName.slice(namespace.length);
}

test("all source-configured rules remain represented", async () => {
  const allRules = defineConfig({ presets: ["all"] }).rules ?? {};

  for (const fixtureName of fixtureNames) {
    const rules = await fixtureRules(fixtureName);
    for (const sourceRuleName of Object.keys(rules)) {
      const customRuleName = normalizedCustomRuleName(sourceRuleName);
      if (customRuleName === null) {
        assert.ok(
          sourceRuleName in allRules,
          `${fixtureName}: missing built-in rule ${sourceRuleName}`,
        );
        continue;
      }
      assert.ok(
        customRuleName in plugin.rules,
        `${fixtureName}: missing custom rule quality/${customRuleName}`,
      );
      assert.ok(
        `quality/${customRuleName}` in allRules,
        `${fixtureName}: all preset omits quality/${customRuleName}`,
      );
    }
  }
});
