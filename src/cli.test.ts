import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

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

function runCli(directory: string, args: readonly string[]) {
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

test("initializer creates the canonical TypeScript config", async () => {
  const directory = await temporaryProject();

  const result = runCli(directory, ["--yes", "--skip-install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(join(directory, "oxlint.config.ts"), "utf8"),
    'import { defineConfig } from "@dakdevs/oxlint-plugin/config";\n\nexport default defineConfig({\n  presets: ["recommended"],\n});\n',
  );
});

test("dry run reports changes without writing files", async () => {
  const directory = await temporaryProject();

  const result = runCli(directory, ["--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would create oxlint\.config\.ts/u);
  await assert.rejects(readFile(join(directory, "oxlint.config.ts"), "utf8"));
});

test("initializer updates only TypeScript configs it previously generated", async () => {
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
  assert.match(await readFile(configPath, "utf8"), /presets: \["boundaries"\]/u);
});
