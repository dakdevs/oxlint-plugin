---
name: install-oxlint-quality
description: Install or update @dakdevs/oxlint-plugin and configure its Oxlint quality presets in a TypeScript or JavaScript repository. Use when asked to add the quality rules, adopt the shared Oxlint policy, or migrate a local copy of these rules.
---

# Install Oxlint quality

Use the package initializer to preserve existing policy while adding the requested presets.

1. Inspect the target repository before changing it:
   - Read its agent instructions and check `git status`.
   - Identify its package manager and Oxlint configuration.
   - Check direct dependencies for React, Next.js, Effect, TypeScript, and `oxlint-tsgolint`.
   - Detect local copies of anti-slop, boundary, or type-discipline rules. Do not delete them during initial installation.

2. Select presets:
   - Use `recommended` when the user did not request a category.
   - Enable `react-next`, `effect`, `type-aware`, `strict`, or other opt-in presets only when the user requests them.
   - If direct dependencies make an optional preset relevant, mention it before enabling it. A transitive lockfile entry is not enough.

3. Query npm for the current package version, then preview the exact change:

   ```bash
   npm view @dakdevs/oxlint-plugin version
   npx --yes @dakdevs/oxlint-plugin@<version> init --dry-run --preset recommended
   ```

   Repeat `--preset` for each requested category. Review the reported config and dependency changes before applying them.

4. Apply the reviewed plan:

   ```bash
   npx --yes @dakdevs/oxlint-plugin@<version> init --yes --preset recommended
   ```

   The initializer safely edits JSON/JSONC configs and creates the canonical TypeScript config when none exists. If it reports an ambiguous existing TypeScript config, manually import `defineConfig` from `@dakdevs/oxlint-plugin/config`, wrap the existing policy, and preserve local rules as final overrides.

5. Run the repository's lint and typecheck commands. When `type-aware` or `effect` is selected, verify that the repository is compatible with TypeScript 7 and that `oxlint-tsgolint` is installed.

Report the selected presets, dependency versions, config path, checks run, and remaining findings. Do not weaken rules, add unsafe assertions, or remove old local plugins until parity has been reviewed.
