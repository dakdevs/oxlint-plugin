#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { applyEdits, modify, parse } from "jsonc-parser";
import { defineConfig, presetNames } from "./config/index.js";
import { currentEffectOxlintTarget, effectOxlintSupportError, } from "./effect-platform.js";
const configFileNames = [
    "oxlint.config.ts",
    "oxlint.config.mts",
    ".oxlintrc.json",
    ".oxlintrc.jsonc",
];
const formatterConfigFileNames = [
    "oxfmt.config.ts",
    "oxfmt.config.mts",
    ".oxfmtrc.json",
    ".oxfmtrc.jsonc",
];
const toolScripts = {
    lint: "oxlint",
    "lint:fix": "oxlint --fix",
    fmt: "oxfmt",
    "fmt:check": "oxfmt --check",
};
const effectPatchArguments = ["patch", "--no-typescript", "--oxlint"];
const effectPatchScript = `effect-tsgo ${effectPatchArguments.join(" ")}`;
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
];
function isJsonObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isPresetName(value) {
    return presetNames.some((name) => name === value);
}
function applyInitOption(state, args, index) {
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
                throw new Error(`--preset must be followed by one of: ${presetNames.join(", ")}`);
            }
            state.presets.push(preset);
            return index + 1;
        }
        default:
            throw new Error(`Unknown option: ${argument ?? ""}`);
    }
}
function parseArguments(args) {
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        return { kind: "help" };
    }
    if (args[0] !== "init") {
        throw new Error(`Unknown command: ${args[0] ?? ""}`);
    }
    const state = {
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
            presets: state.presets.length === 0 ? ["all"] : state.presets,
            skipInstall: state.skipInstall,
            yes: state.yes,
        },
    };
}
function usage() {
    return [
        "Usage: dak-oxlint init [options]",
        "",
        "Options:",
        "  --preset <name>  Opt down from all; repeat to compose explicit presets",
        "  --dry-run        Show planned changes without writing or installing",
        "  --yes, -y        Apply the planned changes",
        "  --skip-install   Do not install package dependencies",
        "  --help, -h       Show this help",
    ].join("\n");
}
async function pathExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
async function findConfig(cwd) {
    const existing = (await Promise.all(configFileNames.map(async (name) => ({
        exists: await pathExists(join(cwd, name)),
        name,
    })))).filter((candidate) => candidate.exists);
    if (existing.length > 1) {
        throw new Error(`Multiple Oxlint configs found: ${existing.map(({ name }) => name).join(", ")}`);
    }
    return existing[0]?.name ?? null;
}
async function findFormatterConfig(cwd) {
    const existing = (await Promise.all(formatterConfigFileNames.map(async (name) => ({
        exists: await pathExists(join(cwd, name)),
        name,
    })))).filter((candidate) => candidate.exists);
    if (existing.length > 1) {
        throw new Error(`Multiple Oxfmt configs found: ${existing.map(({ name }) => name).join(", ")}`);
    }
    return existing[0]?.name ?? null;
}
async function detectPackageManager(cwd) {
    const manifestPath = join(cwd, "package.json");
    const manifest = (await pathExists(manifestPath))
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
    ];
    for (const [file, manager] of lockfiles) {
        if (await pathExists(join(cwd, file)))
            return manager;
    }
    return "npm";
}
function installCommand(manager, presets) {
    const dependencies = [
        "@dakdevs/oxlint-plugin",
        "oxlint@1.80.0",
        "oxfmt@^0.65.0",
    ];
    if (presets.includes("type-aware") || presets.includes("effect") || presets.includes("all")) {
        dependencies.push("oxlint-tsgolint@7.0.2001", "typescript@7.0.2");
    }
    if (presets.includes("effect") || presets.includes("all")) {
        dependencies.push("@effect/tsgo@0.38.0");
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
function stableUnique(values) {
    const seen = new Set();
    return values.filter((value) => {
        const key = JSON.stringify(value);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
function mergeJsonValues(preset, local) {
    if (Array.isArray(preset) && Array.isArray(local)) {
        return stableUnique([...preset, ...local]);
    }
    if (isJsonObject(preset) && isJsonObject(local)) {
        return { ...preset, ...local };
    }
    return local ?? preset;
}
function meaningfulEntries(config) {
    const values = [
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
        if (value === undefined || value === null)
            return false;
        if (Array.isArray(value))
            return value.length > 0;
        if (isJsonObject(value))
            return Object.keys(value).length > 0;
        return true;
    });
}
function updateJsonConfig(source, presets) {
    const errors = [];
    const parsed = parse(source, errors, {
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
function updateFormatterJsonConfig(source) {
    const errors = [];
    const parsed = parse(source, errors, {
        allowTrailingComma: true,
        disallowComments: false,
    });
    if (errors.length > 0 || !isJsonObject(parsed)) {
        throw new Error("The existing Oxfmt JSON config could not be parsed safely.");
    }
    let updated = source;
    for (const [key, value] of [
        ["semi", false],
        ["singleQuote", true],
    ]) {
        const edits = modify(updated, [key], value, {
            formattingOptions: { insertSpaces: true, tabSize: 2 },
        });
        updated = applyEdits(updated, edits);
    }
    return updated.endsWith("\n") ? updated : `${updated}\n`;
}
function typescriptConfig(presets) {
    const list = presets.map((preset) => `'${preset}'`).join(", ");
    return [
        "import { defineConfig } from '@dakdevs/oxlint-plugin/config'",
        "",
        "export default defineConfig({",
        `  presets: [${list}],`,
        "})",
        "",
    ].join("\n");
}
function formatterConfig() {
    return `${JSON.stringify({
        $schema: "./node_modules/oxfmt/configuration_schema.json",
        semi: false,
        singleQuote: true,
    }, null, 2)}\n`;
}
function includesEffect(presets) {
    return presets.includes("effect") || presets.includes("all");
}
function hasPersistentEffectPatch(script) {
    return script.split(/&&|;|\|\|/u).some((command) => /(?:effect-tsgo|@effect\/tsgo)\s+patch\b/u.test(command) &&
        command.includes("--oxlint") &&
        command.includes("--no-typescript"));
}
function scriptsForPresets(presets) {
    return includesEffect(presets)
        ? { ...toolScripts, prepare: effectPatchScript }
        : toolScripts;
}
function decidePackageScript(name, command, existing) {
    if (existing === undefined)
        return { command, kind: "update" };
    if (name !== "prepare" || command !== effectPatchScript) {
        return existing === command ? { kind: "none" } : { kind: "conflict" };
    }
    if (typeof existing !== "string") {
        throw new Error('package.json script "prepare" must be a string.');
    }
    if (hasPersistentEffectPatch(existing))
        return { kind: "none" };
    return {
        command: existing.trim() === "" ? command : `${existing} && ${command}`,
        kind: "update",
    };
}
async function planPackageScripts(cwd, presets) {
    const path = join(cwd, "package.json");
    if (!(await pathExists(path)))
        return null;
    const current = await readFile(path, "utf8");
    const errors = [];
    const parsed = parse(current, errors, {
        allowTrailingComma: false,
        disallowComments: true,
    });
    if (errors.length > 0 || !isJsonObject(parsed)) {
        throw new Error("package.json could not be parsed safely.");
    }
    if (parsed.scripts !== undefined && !isJsonObject(parsed.scripts)) {
        throw new Error("package.json scripts must be an object.");
    }
    const scripts = isJsonObject(parsed.scripts) ? parsed.scripts : {};
    const conflicts = [];
    let updated = current;
    for (const [name, command] of Object.entries(scriptsForPresets(presets))) {
        const decision = decidePackageScript(name, command, scripts[name]);
        if (decision.kind === "conflict") {
            conflicts.push({ command, name });
            continue;
        }
        if (decision.kind === "none")
            continue;
        const edits = modify(updated, ["scripts", name], decision.command, {
            formattingOptions: { insertSpaces: true, tabSize: 2 },
        });
        updated = applyEdits(updated, edits);
    }
    if (!updated.endsWith("\n"))
        updated = `${updated}\n`;
    return {
        change: updated === current
            ? { kind: "none", name: "package.json" }
            : { kind: "update", name: "package.json", source: updated },
        conflicts,
    };
}
function effectPatchCommand(manager) {
    switch (manager) {
        case "bun":
            return ["bunx", ["effect-tsgo", ...effectPatchArguments]];
        case "pnpm":
            return ["pnpm", ["exec", "effect-tsgo", ...effectPatchArguments]];
        case "yarn":
            return ["yarn", ["exec", "effect-tsgo", ...effectPatchArguments]];
        default:
            return ["npm", ["exec", "--", "effect-tsgo", ...effectPatchArguments]];
    }
}
async function applyEffectPatch(cwd, manager, skipInstall) {
    let command;
    let args;
    let shell = false;
    if (skipInstall) {
        const binary = join(cwd, "node_modules", ".bin", process.platform === "win32" ? "effect-tsgo.cmd" : "effect-tsgo");
        if (!(await pathExists(binary))) {
            console.log(`Skipped Effect patch because --skip-install was used and ${binary} is unavailable. Run ${effectPatchScript} after installing dependencies.`);
            return;
        }
        command = binary;
        args = effectPatchArguments;
        shell = process.platform === "win32";
    }
    else {
        [command, args] = effectPatchCommand(manager);
    }
    const result = spawnSync(command, [...args], {
        cwd,
        shell,
        stdio: "inherit",
    });
    if (result.status !== 0) {
        throw new Error(`Effect Oxlint patch failed with exit code ${result.status ?? "unknown"}.`);
    }
}
function reportScriptConflicts(conflicts) {
    for (const { command, name } of conflicts) {
        console.log(`Kept existing package.json script ${JSON.stringify(name)}; run ${JSON.stringify(command)} separately.`);
    }
}
async function planFormatterConfigChange(cwd, configName) {
    if (configName === null) {
        return {
            kind: "create",
            name: ".oxfmtrc.json",
            source: formatterConfig(),
        };
    }
    if (!configName.endsWith(".json") && !configName.endsWith(".jsonc")) {
        throw new Error(`Existing ${configName} requires a manual merge. Set semi to false and singleQuote to true without removing local Oxfmt policy.`);
    }
    const current = await readFile(join(cwd, configName), "utf8");
    const source = updateFormatterJsonConfig(current);
    return source === current
        ? { kind: "none", name: configName }
        : { kind: "update", name: configName, source };
}
function hasGeneratedConfigSkeleton(lines) {
    if (lines.length !== 6)
        return false;
    if (![
        'import { defineConfig } from "@dakdevs/oxlint-plugin/config";',
        "import { defineConfig } from '@dakdevs/oxlint-plugin/config'",
    ].includes(lines[0] ?? ""))
        return false;
    if (lines[1] !== "")
        return false;
    if (lines[2] !== "export default defineConfig({")
        return false;
    if (!["});", "})"].includes(lines[4] ?? ""))
        return false;
    return lines[5] === "";
}
function parseGeneratedPresetList(encoded) {
    if (!encoded.startsWith("[") || !encoded.endsWith("]"))
        return null;
    const entries = encoded.slice(1, -1);
    const parsed = entries === ""
        ? []
        : entries.split(", ").map((entry) => {
            const match = entry.match(/^(['"])([a-z-]+)\1$/u);
            return match?.[2] ?? null;
        });
    return parsed.every((value) => value !== null && isPresetName(value))
        ? parsed
        : null;
}
function generatedPresetNames(source) {
    const lines = source.split("\n");
    if (!hasGeneratedConfigSkeleton(lines))
        return null;
    const presetLine = lines[3];
    if (presetLine === undefined ||
        !presetLine.startsWith("  presets: [") ||
        !presetLine.endsWith("],")) {
        return null;
    }
    const encoded = presetLine.slice("  presets: ".length, -1);
    return parseGeneratedPresetList(encoded);
}
async function planConfigChange(cwd, configName, presets) {
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
    throw new Error(`Existing ${configName} requires a manual merge. Import defineConfig from @dakdevs/oxlint-plugin/config and wrap the existing local policy.`);
}
function describeChange(change, future) {
    if (change.kind === "none")
        return `${change.name} is already configured.`;
    const verb = change.kind === "create" ? "create" : "update";
    return future
        ? `Would ${verb} ${change.name}.`
        : `${verb === "create" ? "Created" : "Updated"} ${change.name}.`;
}
function reportInitializationPlan(configChange, formatterChange, packageScriptPlan) {
    console.log(describeChange(configChange, true));
    console.log(describeChange(formatterChange, true));
    if (packageScriptPlan === null)
        return;
    console.log(describeChange(packageScriptPlan.change, true));
    reportScriptConflicts(packageScriptPlan.conflicts);
}
function reportToolCommands(command, commandArgs, options) {
    if (!options.skipInstall) {
        console.log(`Dependency command: ${command} ${commandArgs.join(" ")}`);
    }
    if (includesEffect(options.presets)) {
        console.log(`Effect patch command: ${effectPatchScript}`);
    }
}
async function installAndPatchTools(cwd, manager, command, commandArgs, options) {
    if (!options.skipInstall) {
        const result = spawnSync(command, [...commandArgs], {
            cwd,
            stdio: "inherit",
        });
        if (result.status !== 0) {
            throw new Error(`${command} failed with exit code ${result.status ?? "unknown"}.`);
        }
    }
    if (includesEffect(options.presets)) {
        await applyEffectPatch(cwd, manager, options.skipInstall);
    }
}
async function applyPlannedChange(cwd, change) {
    if (change === null || change.kind === "none")
        return;
    await writeFile(join(cwd, change.name), change.source);
    console.log(describeChange(change, false));
}
async function initialize(cwd, options) {
    if (includesEffect(options.presets)) {
        const target = currentEffectOxlintTarget();
        const supportError = effectOxlintSupportError(target);
        if (supportError !== null) {
            throw new Error(`${supportError} Re-run with explicit --preset flags that exclude effect, for example --preset recommended.`);
        }
    }
    const [configName, formatterConfigName] = await Promise.all([
        findConfig(cwd),
        findFormatterConfig(cwd),
    ]);
    const change = await planConfigChange(cwd, configName, options.presets);
    const formatterChange = await planFormatterConfigChange(cwd, formatterConfigName);
    const packageScriptPlan = await planPackageScripts(cwd, options.presets);
    reportInitializationPlan(change, formatterChange, packageScriptPlan);
    const manager = await detectPackageManager(cwd);
    const [command, commandArgs] = installCommand(manager, options.presets);
    reportToolCommands(command, commandArgs, options);
    const future = options.dryRun || !options.yes;
    if (future) {
        if (!options.dryRun)
            console.log("Re-run with --yes to apply these changes.");
        return;
    }
    await installAndPatchTools(cwd, manager, command, commandArgs, options);
    const finalPackageScriptPlan = options.skipInstall
        ? packageScriptPlan
        : await planPackageScripts(cwd, options.presets);
    await applyPlannedChange(cwd, change);
    await applyPlannedChange(cwd, formatterChange);
    await applyPlannedChange(cwd, finalPackageScriptPlan?.change ?? null);
}
async function main() {
    try {
        const command = parseArguments(process.argv.slice(2));
        if (command.kind === "help") {
            console.log(usage());
            return;
        }
        await initialize(process.cwd(), command.options);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`dak-oxlint: ${message}`);
        process.exitCode = 1;
    }
}
await main();
//# sourceMappingURL=cli.js.map