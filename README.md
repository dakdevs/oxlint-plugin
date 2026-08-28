# @dakdevs/oxlint-plugin

Reusable Oxlint quality rules and policy presets collected from real production configurations. This package complements Oxlint; it does not replace it.

## Install

```bash
pnpm add --save-dev @dakdevs/oxlint-plugin oxlint
```

Create `oxlint.config.ts`:

```ts
import { defineConfig } from "@dakdevs/oxlint-plugin/config";

export default defineConfig({
  presets: ["recommended", "type-safety"],
});
```

Calling `defineConfig()` without arguments selects `recommended`. When `presets` is provided, only the listed presets are composed. Repository-local fields and rules are merged last, so local policy wins.

For an existing JSON, JSONC, or TypeScript setup, preview the initializer first:

```bash
npx @dakdevs/oxlint-plugin init --dry-run --preset recommended
npx @dakdevs/oxlint-plugin init --yes --preset recommended
```

Repeat `--preset` to compose categories. The initializer preserves existing JSON/JSONC policy, creates the canonical TypeScript config when none exists, detects npm/pnpm/Yarn/Bun, and refuses ambiguous TypeScript rewrites. Use `--skip-install` when dependencies are already managed separately.

## Presets

| Preset | Policy |
| --- | --- |
| `recommended` | Conservative correctness baseline, `core`, and cyclomatic complexity capped at 12 |
| `core` | Portable quality rules and complexity capped at 12 |
| `type-safety` | Assertion evidence, widening, `unknown`, dictionary, and TypeScript syntax policy |
| `type-aware` | Adopted `typescript/no-unsafe-*` rules with `options.typeAware: true` |
| `boundaries` | Boundary parsing, reflection, generic record guards, and type predicates |
| `testing` | Real dependency seams instead of module mocking |
| `architecture` | Exported-type boundary policy |
| `react-next` | Stricter adopted React, Hooks, JSX accessibility, and Next.js settings |
| `effect` | `type-aware`, adopted Effect overrides, and four `@effect/tsgo` presets |
| `strict` | High-friction pedantic policy, including no assertions and extensionless relative code imports |
| `all` | Every compatible preset, intended for evaluation and migration work |

`type-aware` requires TypeScript 7 and `oxlint-tsgolint`. `effect` additionally requires `@effect/tsgo`; these are optional peer dependencies and are installed by the initializer when selected.

## Custom rules

All custom rule IDs use the `quality/` namespace.

| Category | Rule | Summary |
| --- | --- | --- |
| Core | `no-conditional-empty-object-spread` | Reject conditional object spreads that use `{}` as omission control flow |
| Core | `no-shape-in-symbol-names` | Require domain-owned names instead of the structural term `shape` |
| Type safety | `no-chained-type-assertions` | Reject nested assertion chains that discard evidence |
| Type safety | `no-known-value-widening` | Preserve known values instead of explicitly widening them |
| Type safety | `no-object-parameters` | Reject broad `object` function inputs |
| Type safety | `no-unknown-parameters` | Require parsed domain inputs, except the adopted `cause` convention |
| Type safety | `no-unknown-returns` | Reject contracts returning `unknown` or `Promise<unknown>` |
| Type safety | `no-unknown-type-aliases` | Reject aliases that merely hide `unknown` |
| Type safety | `no-unsafe-dictionary-type` | Reject dictionaries whose values are `unknown`, `any`, `object`, or empty objects |
| Type safety | `no-widen-then-assert` | Reject local flows that widen a known value and later assert it back |
| Type safety | `require-safety-comment-for-type-assertion` | Require a checked-invariant explanation for non-const assertions |
| Boundaries | `no-generic-record-guard` | Require an explicit boundary schema instead of a generic record guard |
| Boundaries | `no-unjustified-type-predicate` | Require schema decoding or the adopted adjacent boundary exception |
| Boundaries | `no-runtime-typeof` | Prefer boundary decoding to ad hoc runtime `typeof` narrowing |
| Boundaries | `no-reflect-apply` | Prefer typed calls to `Reflect.apply` |
| Boundaries | `no-reflect-get` | Prefer typed property access or boundary parsing to `Reflect.get` |
| Testing | `no-module-mocking` | Reject Vitest and Jest module mocks |
| Architecture | `no-exported-types` | Keep type declarations local and derive cross-module contracts |
| Strict | `no-type-assertions` | Reject all TypeScript assertions except `as const` |
| Strict | `extensionless-relative-code-imports` | Require extensionless relative TS/JS module specifiers |

The `strict` preset disables `require-safety-comment-for-type-assertion` when it enables `no-type-assertions`, preventing duplicate diagnostics.

## Manual plugin registration

Consumers that do not use the preset API can register only the plugin:

```json
{
  "jsPlugins": [
    {
      "name": "quality",
      "specifier": "@dakdevs/oxlint-plugin"
    }
  ],
  "rules": {
    "quality/no-module-mocking": "error"
  }
}
```

## Development

```bash
pnpm install
pnpm check
```

`src/` is canonical. Rule behavior is tested through Oxlint's `RuleTester`; config and initializer behavior are tested through their public interfaces. See `PROVENANCE.md` and `test/fixtures/source-configs/` for the adopted snapshots.

## License

MIT. Anti-slop-derived portions retain their original notice in `NOTICE`.
