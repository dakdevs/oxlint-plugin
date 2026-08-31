import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { parse } from "jsonc-parser";

const cliPath = resolve("src/cli.ts");
const tsxLoader = import.meta.resolve("tsx");
const temporaryDirectories: string[] = [];

test.afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

async function temporaryProject(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "dak-oxlint-init-"));
  temporaryDirectories.push(directory);
  await writeFile(
    join(directory, "package.json"),
    `${JSON.stringify({ name: "fixture", private: true }, null, 2)}\n`,
  );
  return directory;
}

function runCli(
  directory: string,
  args: readonly string[],
  runtime?: { readonly architecture: string; readonly platform: string },
) {
  if (runtime !== undefined) {
    const bootstrap = [
      `Object.defineProperty(process, "arch", { value: ${JSON.stringify(runtime.architecture)} })`,
      `Object.defineProperty(process, "platform", { value: ${JSON.stringify(runtime.platform)} })`,
      `process.argv = ${JSON.stringify([process.execPath, cliPath, "init", ...args])}`,
      `await import(${JSON.stringify(pathToFileURL(cliPath).href)})`,
    ].join(";\n");
    return spawnSync(
      process.execPath,
      ["--import", tsxLoader, "--input-type=module", "--eval", bootstrap],
      { cwd: directory, encoding: "utf8" },
    );
  }
  return spawnSync(
    process.execPath,
    ["--import", tsxLoader, cliPath, "init", ...args],
    {
      cwd: directory,
      encoding: "utf8",
    },
  );
}

test("initializer updates JSON config without discarding local policy", async () => {
  const directory = await temporaryProject();
  const configPath = join(directory, ".oxlintrc.json");
  await writeFile(
    configPath,
    '{\n  "rules": {\n    "no-console": "off"\n  }\n}\n',
  );

  const result = runCli(directory, [
    "--yes",
    "--skip-install",
    "--preset",
    "boundaries",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const firstRun = await readFile(configPath, "utf8");
  const parsed = JSON.parse(firstRun);
  assert.equal(parsed.rules["no-console"], "off");
  assert.equal(parsed.rules["quality/no-runtime-typeof"], "error");
  assert.deepEqual(parsed.jsPlugins, [
    { name: "quality", specifier: "@dakdevs/oxlint-plugin" },
  ]);

  const secondResult = runCli(directory, [
    "--yes",
    "--skip-install",
    "--preset",
    "boundaries",
  ]);
  assert.equal(secondResult.status, 0, secondResult.stderr);
  assert.equal(await readFile(configPath, "utf8"), firstRun);
});

test("initializer creates the full lint and formatting policy by default", async () => {
  const directory = await temporaryProject();

  const result = runCli(directory, ["--yes", "--skip-install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(join(directory, "oxlint.config.ts"), "utf8"),
    "import { defineConfig } from '@dakdevs/oxlint-plugin/config'\n\nexport default defineConfig({\n  presets: ['all'],\n})\n",
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(directory, ".oxfmtrc.json"), "utf8")),
    {
      $schema: "./node_modules/oxfmt/configuration_schema.json",
      semi: false,
      singleQuote: true,
    },
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(directory, "package.json"), "utf8")).scripts,
    {
      fmt: "oxfmt",
      "fmt:check": "oxfmt --check",
      lint: "oxlint",
      "lint:fix": "oxlint --fix",
      prepare: "effect-tsgo patch --no-typescript --oxlint",
    },
  );
});

test("initializer preserves JSONC formatter policy while enforcing project style", async () => {
  const directory = await temporaryProject();
  const configPath = join(directory, ".oxfmtrc.jsonc");
  await writeFile(
    configPath,
    '{\n  // Keep the repository line length.\n  "printWidth": 88,\n  "semi": true,\n  "singleQuote": false\n}\n',
  );

  const result = runCli(directory, ["--yes", "--skip-install"]);

  assert.equal(result.status, 0, result.stderr);
  const firstRun = await readFile(configPath, "utf8");
  assert.match(firstRun, /Keep the repository line length/u);
  assert.deepEqual(parse(firstRun), {
    printWidth: 88,
    semi: false,
    singleQuote: true,
  });
  await assert.rejects(readFile(join(directory, ".oxfmtrc.json"), "utf8"));

  const secondResult = runCli(directory, ["--yes", "--skip-install"]);
  assert.equal(secondResult.status, 0, secondResult.stderr);
  assert.equal(await readFile(configPath, "utf8"), firstRun);
});

test("initializer composes existing package scripts and is idempotent", async () => {
  const directory = await temporaryProject();
  const manifestPath = join(directory, "package.json");
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        name: "fixture",
        private: true,
        scripts: {
          lint: "custom-lint",
          prepare: "custom-prepare",
          test: "node --test",
        },
      },
      null,
      2,
    )}\n`,
  );

  const result = runCli(directory, ["--yes", "--skip-install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Kept existing package\.json script "lint"/u);
  assert.doesNotMatch(result.stdout, /script "prepare"/u);
  const firstRun = await readFile(manifestPath, "utf8");
  assert.deepEqual(JSON.parse(firstRun).scripts, {
    lint: "custom-lint",
    test: "node --test",
    "lint:fix": "oxlint --fix",
    fmt: "oxfmt",
    "fmt:check": "oxfmt --check",
    prepare:
      "custom-prepare && effect-tsgo patch --no-typescript --oxlint",
  });

  const secondResult = runCli(directory, ["--yes", "--skip-install"]);
  assert.equal(secondResult.status, 0, secondResult.stderr);
  assert.equal(await readFile(manifestPath, "utf8"), firstRun);
});

test("initializer recognizes an existing persistent Effect patch", async () => {
  const directory = await temporaryProject();
  const manifestPath = join(directory, "package.json");
  const existingPrepare =
    "custom-prepare && pnpm exec effect-tsgo patch --oxlint --no-typescript";
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        name: "fixture",
        private: true,
        scripts: { prepare: existingPrepare },
      },
      null,
      2,
    )}\n`,
  );

  const result = runCli(directory, ["--yes", "--skip-install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    JSON.parse(await readFile(manifestPath, "utf8")).scripts.prepare,
    existingPrepare,
  );
});

test("initializer rejects unsupported Effect targets before mutation", async () => {
  const directory = await temporaryProject();
  const manifestPath = join(directory, "package.json");
  const originalManifest = await readFile(manifestPath, "utf8");

  const result = runCli(
    directory,
    ["--yes", "--skip-install"],
    { architecture: "ppc64", platform: "linux" },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /unsupported architecture ppc64/iu);
  assert.match(result.stderr, /explicit --preset flags that exclude effect/u);
  assert.equal(await readFile(manifestPath, "utf8"), originalManifest);
  await assert.rejects(readFile(join(directory, "oxlint.config.ts"), "utf8"));
  await assert.rejects(readFile(join(directory, ".oxfmtrc.json"), "utf8"));
});

test("initializer refuses to overwrite a hand-authored TypeScript formatter config", async () => {
  const directory = await temporaryProject();
  const formatterPath = join(directory, "oxfmt.config.ts");
  const formatterSource =
    "import { defineConfig } from 'oxfmt'\n\nexport default defineConfig({ printWidth: 88 })\n";
  await writeFile(formatterPath, formatterSource);

  const result = runCli(directory, ["--yes", "--skip-install"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires a manual merge/u);
  assert.match(result.stderr, /semi to false and singleQuote to true/u);
  assert.equal(await readFile(formatterPath, "utf8"), formatterSource);
  await assert.rejects(readFile(join(directory, "oxlint.config.ts"), "utf8"));
});

test("initializer refuses ambiguous Oxfmt configuration", async () => {
  const directory = await temporaryProject();
  await writeFile(join(directory, ".oxfmtrc.json"), "{}\n");
  await writeFile(join(directory, ".oxfmtrc.jsonc"), "{}\n");

  const result = runCli(directory, ["--yes", "--skip-install"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Multiple Oxfmt configs found/u);
  await assert.rejects(readFile(join(directory, "oxlint.config.ts"), "utf8"));
});

test("dry run reports changes without writing files", async () => {
  const directory = await temporaryProject();

  const result = runCli(directory, ["--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would create oxlint\.config\.ts/u);
  assert.match(result.stdout, /Would create \.oxfmtrc\.json/u);
  assert.match(result.stdout, /oxfmt@\^0\.65\.0/u);
  assert.match(result.stdout, /oxlint@1\.80\.0/u);
  assert.match(result.stdout, /oxlint-tsgolint@7\.0\.2001/u);
  assert.match(result.stdout, /typescript@7\.0\.2/u);
  assert.match(result.stdout, /@effect\/tsgo@0\.38\.0/u);
  assert.match(
    result.stdout,
    /Effect patch command: effect-tsgo patch --no-typescript --oxlint/u,
  );
  await assert.rejects(readFile(join(directory, "oxlint.config.ts"), "utf8"));
  await assert.rejects(readFile(join(directory, ".oxfmtrc.json"), "utf8"));
  assert.equal(
    JSON.parse(await readFile(join(directory, "package.json"), "utf8")).scripts,
    undefined,
  );
});

test("initializer upgrades the legacy TypeScript config it previously generated", async () => {
  const directory = await temporaryProject();
  const configPath = join(directory, "oxlint.config.ts");
  await writeFile(
    configPath,
    'import { defineConfig } from "@dakdevs/oxlint-plugin/config";\n\nexport default defineConfig({\n  presets: ["recommended"],\n});\n',
  );

  const result = runCli(directory, [
    "--yes",
    "--skip-install",
    "--preset",
    "boundaries",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(configPath, "utf8"),
    "import { defineConfig } from '@dakdevs/oxlint-plugin/config'\n\nexport default defineConfig({\n  presets: ['boundaries'],\n})\n",
  );
});

test("initializer updates the semicolon-free TypeScript config it generated", async () => {
  const directory = await temporaryProject();
  const configPath = join(directory, "oxlint.config.ts");
  await writeFile(
    configPath,
    "import { defineConfig } from '@dakdevs/oxlint-plugin/config'\n\nexport default defineConfig({\n  presets: ['all'],\n})\n",
  );

  const result = runCli(directory, [
    "--yes",
    "--skip-install",
    "--preset",
    "boundaries",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(configPath, "utf8"),
    "import { defineConfig } from '@dakdevs/oxlint-plugin/config'\n\nexport default defineConfig({\n  presets: ['boundaries'],\n})\n",
  );
});
