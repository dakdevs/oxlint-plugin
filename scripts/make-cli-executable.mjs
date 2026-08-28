import { chmod } from "node:fs/promises";
import process from "node:process";

if (process.platform !== "win32") {
  await chmod(new URL("../dist/cli.js", import.meta.url), 0o755);
}
