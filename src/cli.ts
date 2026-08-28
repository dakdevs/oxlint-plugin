#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

import { applyEdits, modify, parse } from "jsonc-parser";

import { defineConfig, presetNames } from "./config/index.js";

import type { OxlintConfig } from "oxlint";
import type { ParseError } from "jsonc-parser";
import type { PresetName } from "./config/index.js";

const configFileNames = [
  "oxlint.config.ts",
  "oxlint.config.mts",
  ".oxlintrc.json",
  ".oxlintrc.jsonc",
] as const;

const agentIgnorePatterns = [
  ".agent/**",
  ".agents/**",
  ".claude/**",
  ".codex/**",
  ".continue/**",
  ".cursor/**",
  ".gemini/**",
  ".opencode/**",
  ".pi/**",
  ".roo/**",
  ".windsurf/**",
] as const;

type InitOptions = {
  readonly dryRun: boolean;
  readonly presets: readonly PresetName[];
  readonly skipInstall: boolean;
  readonly yes: boolean;
};

type MutableInitOptions = {
  dryRun: boolean;
  presets: PresetName[];
  skipInstall: boolean;
  yes: boolean;
};

type CliCommand =
  | { readonly kind: "help" }
  | { readonly kind: "init"; readonly options: InitOptions };

type JsonObject = { readonly [key: string]: unknown };

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPresetName(value: string): value is PresetName {
  return presetNames.some((name) => name === value);
}

function applyInitOption(
  state: MutableInitOptions,
  args: readonly string[],
  index: number,
): number {
  const argument = args[index];
  switch (argument) {
    case "--dry-run":
      state.dryRun = true;
      return index;
    case "--skip-install":
      state.skipInstall = true;
      return index;
    case "--yes":
    case "-y":
      state.yes = true;
      return index;
    case "--preset": {
      const preset = args[index + 1];
      if (preset === undefined || !isPresetName(preset)) {
        throw new Error(
          `--preset must be followed by one of: ${presetNames.join(", ")}`,
        );
      }
      state.presets.push(preset);
      return index + 1;
    }
    default:
      throw new Error(`Unknown option: ${argument ?? ""}`);
  }
}

function parseArguments(args: readonly string[]): CliCommand {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return { kind: "help" };
  }
  if (args[0] !== "init") {
    throw new Error(`Unknown command: ${args[0] ?? ""}`);
  }

  const state: MutableInitOptions = {
    dryRun: false,
    presets: [],
    skipInstall: false,
    yes: false,
  };

  for (let index = 1; index < args.length; index += 1) {
    index = applyInitOption(state, args, index);
  }

  return {
    kind: "init",
    options: {
      dryRun: state.dryRun,
      presets: state.presets.length === 0 ? ["recommended"] : state.presets,
      skipInstall: state.skipInstall,
      yes: state.yes,
    },
  };
}

function usage(): string {
  return [
    "Usage: dak-oxlint init [options]",
    "",
    "Options:",
    "  --preset <name>  Select a policy preset; repeat for multiple presets",
    "  --dry-run        Show planned changes without writing or installing",
    "  --yes, -y        Apply the planned changes",
    "  --skip-install   Do not install package dependencies",
    "  --help, -h       Show this help",
  ].join("\n");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findConfig(cwd: string): Promise<string | null> {
  const existing = (
    await Promise.all(
      configFileNames.map(async (name) => ({
        exists: await pathExists(join(cwd, name)),
        name,
      })),
    )
  ).filter((candidate) => candidate.exists);

  if (existing.length > 1) {
    throw new Error(
      `Multiple Oxlint configs found: ${existing.map(({ name }) => name).join(", ")}`,
    );
  }
  return existing[0]?.name ?? null;
}

async function detectPackageManager(cwd: string): Promise<string> {
  const manifestPath = join(cwd, "package.json");
  const manifest: unknown = (await pathExists(manifestPath))
    ? JSON.parse(await readFile(manifestPath, "utf8"))
    : {};
  if (isJsonObject(manifest) && typeof manifest.packageManager === "string") {
    return manifest.packageManager.split("@")[0] ?? "npm";
  }
  const lockfiles = [
    ["pnpm-lock.yaml", "pnpm"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
  ] as const;
  for (const [file, manager] of lockfiles) {
    if (await pathExists(join(cwd, file))) return manager;
  }
  return "npm";
}

function installCommand(
  manager: string,
  presets: readonly PresetName[],
): readonly [string, readonly string[]] {
  const dependencies = ["@dakdevs/oxlint-plugin", "oxlint@^1.78.0"];
  if (presets.includes("type-aware") || presets.includes("effect") || presets.includes("all")) {
    dependencies.push("oxlint-tsgolint@^7.0.2001", "typescript@^7.0.2");
  }
  if (presets.includes("effect") || presets.includes("all")) {
    dependencies.push("@effect/tsgo@^0.36.5");
  }

  switch (manager) {
    case "bun":
      return ["bun", ["add", "--dev", ...dependencies]];
    case "pnpm":
      return ["pnpm", ["add", "--save-dev", ...dependencies]];
    case "yarn":
      return ["yarn", ["add", "--dev", ...dependencies]];
    default:
      return ["npm", ["install", "--save-dev", ...dependencies]];
  }
}

function stableUnique(values: readonly unknown[]): unknown[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeJsonValues(preset: unknown, local: unknown): unknown {
  if (Array.isArray(preset) && Array.isArray(local)) {
    return stableUnique([...preset, ...local]);
  }
  if (isJsonObject(preset) && isJsonObject(local)) {
    return { ...preset, ...local };
  }
  return local ?? preset;
}

function meaningfulEntries(config: OxlintConfig): readonly [string, unknown][] {
  const values: readonly [string, unknown][] = [
    ["categories", config.categories],
    ["env", config.env],
    ["globals", config.globals],
    ["ignorePatterns", [
      ...agentIgnorePatterns,
      ...(config.ignorePatterns ?? []),
    ]],
    ["jsPlugins", config.jsPlugins],
    ["options", config.options],
    ["overrides", config.overrides],
    ["plugins", config.plugins],
    ["rules", config.rules],
    ["settings", config.settings],
  ];
  return values.filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (isJsonObject(value)) return Object.keys(value).length > 0;
    return true;
  });
}

function updateJsonConfig(
  source: string,
  presets: readonly PresetName[],
): string {
  const errors: ParseError[] = [];
  const parsed: unknown = parse(source, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });
  if (errors.length > 0 || !isJsonObject(parsed)) {
    throw new Error("The existing Oxlint JSON config could not be parsed safely.");
  }

  let updated = source;
  const presetConfig = defineConfig({ presets });
  for (const [key, presetValue] of meaningfulEntries(presetConfig)) {
    const nextValue = mergeJsonValues(presetValue, parsed[key]);
    const edits = modify(updated, [key], nextValue, {
      formattingOptions: { insertSpaces: true, tabSize: 2 },
    });
    updated = applyEdits(updated, edits);
  }
  return updated.endsWith("\n") ? updated : `${updated}\n`;
}

function typescriptConfig(presets: readonly PresetName[]): string {
  const list = presets.map((preset) => `"${preset}"`).join(", ");
  return [
    'import { defineConfig } from "@dakdevs/oxlint-plugin/config";',
    "",
    "export default defineConfig({",
    `  presets: [${list}],`,
    "});",
    "",
  ].join("\n");
}

function generatedPresetNames(source: string): readonly PresetName[] | null {
  const lines = source.split("\n");
  if (
    lines.length !== 6 ||
    lines[0] !==
      'import { defineConfig } from "@dakdevs/oxlint-plugin/config";' ||
    lines[1] !== "" ||
    lines[2] !== "export default defineConfig({" ||
    lines[4] !== "});" ||
    lines[5] !== ""
  ) {
    return null;
  }
  const presetLine = lines[3];
  if (
    presetLine === undefined ||
    !presetLine.startsWith("  presets: [") ||
    !presetLine.endsWith("],")
  ) {
    return null;
  }
  const encoded = presetLine.slice("  presets: ".length, -1);
  const parsed: unknown = JSON.parse(encoded);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (value): value is PresetName =>
        typeof value === "string" && isPresetName(value),
    )
  ) {
    return null;
  }
  return parsed;
}

async function planConfigChange(
  cwd: string,
  configName: string | null,
  presets: readonly PresetName[],
): Promise<
  | { readonly kind: "create"; readonly name: string; readonly source: string }
  | { readonly kind: "none"; readonly name: string }
  | { readonly kind: "update"; readonly name: string; readonly source: string }
> {
  if (configName === null) {
    return {
      kind: "create",
      name: "oxlint.config.ts",
      source: typescriptConfig(presets),
    };
  }

  const path = join(cwd, configName);
  const current = await readFile(path, "utf8");
  if (configName.endsWith(".json") || configName.endsWith(".jsonc")) {
    const source = updateJsonConfig(current, presets);
    return source === current
      ? { kind: "none", name: configName }
      : { kind: "update", name: configName, source };
  }

  if (current.includes("@dakdevs/oxlint-plugin/config")) {
    if (generatedPresetNames(current) === null) {
      return { kind: "none", name: configName };
    }
    const source = typescriptConfig(presets);
    return source === current
      ? { kind: "none", name: configName }
      : { kind: "update", name: configName, source };
  }
  throw new Error(
    `Existing ${configName} requires a manual merge. Import defineConfig from @dakdevs/oxlint-plugin/config and wrap the existing local policy.`,
  );
}

function describeChange(
  change:
    | { readonly kind: "create"; readonly name: string }
    | { readonly kind: "none"; readonly name: string }
    | { readonly kind: "update"; readonly name: string },
  future: boolean,
): string {
  if (change.kind === "none") return `${change.name} is already configured.`;
  const verb = change.kind === "create" ? "create" : "update";
  return future
    ? `Would ${verb} ${change.name}.`
    : `${verb === "create" ? "Created" : "Updated"} ${change.name}.`;
}

async function initialize(cwd: string, options: InitOptions): Promise<void> {
  const configName = await findConfig(cwd);
  const change = await planConfigChange(cwd, configName, options.presets);
  const future = options.dryRun || !options.yes;
  console.log(describeChange(change, true));

  const manager = await detectPackageManager(cwd);
  const [command, commandArgs] = installCommand(manager, options.presets);
  if (!options.skipInstall) {
    console.log(`Dependency command: ${command} ${commandArgs.join(" ")}`);
  }

  if (future) {
    if (!options.dryRun) console.log("Re-run with --yes to apply these changes.");
    return;
  }

  if (!options.skipInstall) {
    const result = spawnSync(command, [...commandArgs], { cwd, stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error(`${command} failed with exit code ${result.status ?? "unknown"}.`);
    }
  }

  if (change.kind !== "none") {
    await writeFile(join(cwd, change.name), change.source);
    console.log(describeChange(change, false));
  }
}

async function main(): Promise<void> {
  try {
    const command = parseArguments(process.argv.slice(2));
    if (command.kind === "help") {
      console.log(usage());
      return;
    }
    await initialize(process.cwd(), command.options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`dak-oxlint: ${message}`);
    process.exitCode = 1;
  }
}

await main();
