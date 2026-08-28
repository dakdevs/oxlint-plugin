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
    `${JSON.stringify({ name: "package-integration", private: true }, null, 2)}\n`,
  );
  run(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      tarball,
      "oxlint@1.80.0",
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
    ["init", "--yes", "--skip-install", "--preset", "core"],
    temporaryDirectory,
  );
  const generatedConfig = await readFile(
    join(temporaryDirectory, "oxlint.config.ts"),
    "utf8",
  );
  if (!generatedConfig.includes("@dakdevs/oxlint-plugin/config")) {
    throw new Error("The installed initializer did not create the package config.");
  }

  await writeFile(
    join(temporaryDirectory, "fixture.ts"),
    "export const payloadShape = {};\n",
  );
  const oxlint = join(temporaryDirectory, "node_modules", ".bin", "oxlint");
  const lintResult = spawnSync(oxlint, ["fixture.ts"], {
    cwd: temporaryDirectory,
    encoding: "utf8",
  });
  const lintOutput = `${lintResult.stdout}${lintResult.stderr}`;
  if (
    lintResult.status === 0 ||
    !lintOutput.includes("quality(no-shape-in-symbol-names)")
  ) {
    throw new Error(`Installed package did not emit the expected rule:\n${lintOutput}`);
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

console.log("Installed-package integration passed.");
