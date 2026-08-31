import assert from "node:assert/strict";
import test from "node:test";

import { effectOxlintSupportError } from "./effect-platform.js";

test("Effect Oxlint platform support matches the patcher's packaged targets", () => {
  assert.equal(
    effectOxlintSupportError({
      architecture: "arm64",
      glibc: false,
      platform: "darwin",
    }),
    null,
  );
  assert.equal(
    effectOxlintSupportError({
      architecture: "x64",
      glibc: true,
      platform: "linux",
    }),
    null,
  );
  assert.match(
    effectOxlintSupportError({
      architecture: "x64",
      glibc: false,
      platform: "linux",
    }) ?? "",
    /musl/u,
  );
  assert.match(
    effectOxlintSupportError({
      architecture: "riscv64",
      glibc: true,
      platform: "linux",
    }) ?? "",
    /architecture riscv64/u,
  );
  assert.match(
    effectOxlintSupportError({
      architecture: "x64",
      glibc: false,
      platform: "freebsd",
    }) ?? "",
    /platform freebsd/u,
  );
});
