---
name: install-oxlint-quality
description: Install or update @dakdevs/oxlint-plugin and configure its Oxlint quality presets in a TypeScript or JavaScript repository. Use when asked to add the quality rules, adopt the shared Oxlint policy, or migrate a local copy of these rules.
---

# Install Oxlint quality

Use the package initializer to preserve existing policy while adding the full quality and formatting baseline. The default is `all`; `--preset` is an explicit opt-down.

1. Inspect the target repository before changing it:
   - Read its agent instructions and check `git status`.
   - Identify its package manager and Oxlint configuration.
   - Inspect existing Oxfmt, Prettier, and Biome configuration so formatter migration does not discard local policy.
   - Check all four Oxfmt auto-discovered config names: `.oxfmtrc.json`, `.oxfmtrc.jsonc`, `oxfmt.config.ts`, and `oxfmt.config.mts`. Stop for a manual choice if more than one exists.
   - Detect local copies of anti-slop, boundary, or type-discipline rules. Do not delete them during initial installation.

2. Select presets:
   - Use `all` when the user did not request a narrower policy.
   - Treat one or more `--preset` flags as an explicit selection; do not silently add other presets.
   - `all` installs the tested tooling tuple: Oxlint 1.80, Oxfmt `^0.65`, TypeScript 7.0.2, `oxlint-tsgolint` 7.0.2001, and `@effect/tsgo` 0.38.

3. Query npm for the current package version, then preview the exact change:

   ```bash
   npm view @dakdevs/oxlint-plugin version
   npx --yes @dakdevs/oxlint-plugin@<version> init --dry-run
   ```

   For a requested subset, repeat `--preset` for each selected category. Review the reported Oxlint config, Oxfmt config, scripts, and dependency changes before applying them.

4. Apply the reviewed plan:

   ```bash
   npx --yes @dakdevs/oxlint-plugin@<version> init --yes
   ```

   The initializer safely edits JSON/JSONC Oxlint configs and creates the canonical TypeScript config when none exists. If it reports an ambiguous existing TypeScript config, manually import `defineConfig` from `@dakdevs/oxlint-plugin/config`, wrap the existing policy, and preserve local rules as final overrides.

   It creates `.oxfmtrc.json` with `singleQuote: true` and `semi: false` if none exists, or updates only those fields in JSON/JSONC Oxfmt configs. For existing `oxfmt.config.ts` or `oxfmt.config.mts`, manually merge those settings without removing local Oxfmt policy. Oxfmt is deliberately a committed formatter config separate from the shared Oxlint config.

   Add the official scripts only when absent: `lint` (`oxlint`), `lint:fix` (`oxlint --fix`), `fmt` (`oxfmt`), and `fmt:check` (`oxfmt --check`). Preserve any conflicting local script and report the command to run separately. For `all` or `effect`, the initializer must run `effect-tsgo patch --no-typescript --oxlint` and persist it in `prepare`; compose it after an existing `prepare` command without removing that command or adding the patch twice. If `--skip-install` defers the patch because dependencies are missing, run it immediately after dependency installation.

5. Validate the resulting configuration with the repository's commands, or directly run `oxlint`, `oxfmt --check`, and the typecheck command when scripts are absent. When `type-aware`, `effect`, or `all` is selected, verify TypeScript 7 plus `oxlint-tsgolint`; `effect` and `all` also require `@effect/tsgo`.

Report the selected presets, dependency versions, Oxlint and Oxfmt config paths, scripts added or preserved, checks run, and remaining findings. Follow repository agent guidance throughout, but do not automatically rewrite `AGENTS.md`. Do not weaken rules, add unsafe assertions, or remove old local plugins until parity has been reviewed.
