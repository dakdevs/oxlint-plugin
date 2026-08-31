import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(" ")} failed with ${result.status ?? "unknown"}`,
        result.stdout,
        result.stderr,
      ].join("\n"),
    );
  }
  return result;
}

const repository = resolve(import.meta.dirname, "..");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "dak-oxlint-package-"));

try {
  run(
    "pnpm",
    [
      "--config.ignore-scripts=true",
      "pack",
      "--pack-destination",
      temporaryDirectory,
    ],
    repository,
  );
  const tarball = join(
    temporaryDirectory,
    "dakdevs-oxlint-plugin-0.1.0.tgz",
  );
  await writeFile(
    join(temporaryDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "package-integration",
        private: true,
        scripts: { prepare: "node custom-prepare.mjs" },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(temporaryDirectory, "custom-prepare.mjs"),
    "import { writeFileSync } from 'node:fs'\n\nwriteFileSync('.custom-prepare-ran', 'yes\\n')\n",
  );
  run(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      "--save-exact",
      tarball,
      "@effect/tsgo@0.38.0",
      "effect@3.22.1",
      "oxlint@1.80.0",
      "oxlint-tsgolint@7.0.2001",
      "oxfmt@0.65.0",
      "typescript@7.0.2",
    ],
    temporaryDirectory,
  );
  const initializer = join(
    temporaryDirectory,
    "node_modules",
    ".bin",
    "dak-oxlint",
  );
  run(
    initializer,
    ["init", "--yes", "--skip-install"],
    temporaryDirectory,
  );
  const generatedConfig = await readFile(
    join(temporaryDirectory, "oxlint.config.ts"),
    "utf8",
  );
  if (!generatedConfig.includes("@dakdevs/oxlint-plugin/config")) {
    throw new Error("The installed initializer did not create the package config.");
  }
  if (!generatedConfig.includes("presets: ['all']")) {
    throw new Error("The installed initializer did not enable every preset by default.");
  }

  const formatterConfig = JSON.parse(
    await readFile(join(temporaryDirectory, ".oxfmtrc.json"), "utf8"),
  );
  if (formatterConfig.semi !== false || formatterConfig.singleQuote !== true) {
    throw new Error("The installed initializer did not configure the requested style.");
  }
  const installedManifest = JSON.parse(
    await readFile(join(temporaryDirectory, "package.json"), "utf8"),
  );
  if (
    installedManifest.scripts?.prepare !==
    "node custom-prepare.mjs && effect-tsgo patch --no-typescript --oxlint"
  ) {
    throw new Error(
      "The installed initializer did not compose the persistent Effect patch.",
    );
  }

  await rm(join(temporaryDirectory, "node_modules"), {
    force: true,
    recursive: true,
  });
  run(
    "npm",
    ["install", "--no-audit", "--no-fund", "--no-package-lock"],
    temporaryDirectory,
  );
  if ((await readFile(join(temporaryDirectory, ".custom-prepare-ran"), "utf8")) !== "yes\n") {
    throw new Error("A clean install did not preserve the existing prepare command.");
  }

  await writeFile(
    join(temporaryDirectory, "fixture.ts"),
    'export const payloadShape = "value";\n',
  );
  await writeFile(
    join(temporaryDirectory, "effect-fixture.ts"),
    "import { Effect } from 'effect'\n\nexport const now = new Date()\nexport const unsafe = Effect.gen(function* () {\n  yield* Effect.context<unknown>()\n  return yield* Effect.fail<any>('boom')\n})\n",
  );
  await writeFile(
    join(temporaryDirectory, "tsconfig.json"),
    `${JSON.stringify({ compilerOptions: { strict: true } }, null, 2)}\n`,
  );
  const oxfmt = join(temporaryDirectory, "node_modules", ".bin", "oxfmt");
  run(oxfmt, ["fixture.ts"], temporaryDirectory);
  const formattedFixture = await readFile(
    join(temporaryDirectory, "fixture.ts"),
    "utf8",
  );
  if (formattedFixture !== "export const payloadShape = 'value'\n") {
    throw new Error(`Oxfmt did not apply the requested style:\n${formattedFixture}`);
  }

  const oxlint = join(temporaryDirectory, "node_modules", ".bin", "oxlint");
  const lintResult = spawnSync(oxlint, ["fixture.ts", "effect-fixture.ts"], {
    cwd: temporaryDirectory,
    encoding: "utf8",
  });
  const lintOutput = `${lintResult.stdout}${lintResult.stderr}`;
  if (
    lintResult.status === 0 ||
    !lintOutput.includes("quality(no-shape-in-symbol-names)") ||
    !lintOutput.includes("effecttsgo(global-date)") ||
    !lintOutput.includes("effecttsgo(any-unknown-in-error-context)")
  ) {
    throw new Error(`Installed package did not emit the expected rule:\n${lintOutput}`);
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

console.log("Installed-package integration passed.");
