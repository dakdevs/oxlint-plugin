# @dakdevs/oxlint-plugin

Reusable Oxlint quality rules and policy presets collected from real production configurations. This package complements Oxlint; it does not replace it.

## Install

```bash
pnpm add --save-dev @dakdevs/oxlint-plugin oxlint@1.80.0 oxfmt@^0.65.0 oxlint-tsgolint@7.0.2001 typescript@7.0.2 @effect/tsgo@0.38.0
pnpm exec effect-tsgo patch --no-typescript --oxlint
```

Create `oxlint.config.ts`:

```ts
import { defineConfig } from '@dakdevs/oxlint-plugin/config'

export default defineConfig()
```

`defineConfig()` enables every preset. Supply `presets` only to opt down to an explicit subset; repository-local fields and rules are merged last, so local policy wins.

For an existing JSON, JSONC, or TypeScript setup, preview the initializer first. With no `--preset`, the CLI also selects `all`:

```bash
npx @dakdevs/oxlint-plugin init --dry-run
npx @dakdevs/oxlint-plugin init --yes
```

Pass `--preset` to opt down, and repeat it to compose an explicit subset:

```bash
npx @dakdevs/oxlint-plugin init --yes --preset recommended --preset type-safety
```

The initializer preserves existing JSON/JSONC Oxlint policy, creates the canonical TypeScript config when none exists, detects npm/pnpm/Yarn/Bun, and refuses ambiguous TypeScript rewrites. It also installs a tested tooling tuple: this package, Oxlint 1.80, Oxfmt (`^0.65`), TypeScript 7.0.2, `oxlint-tsgolint` 7.0.2001, and `@effect/tsgo` 0.38. Effect-backed presets are supported on x64 and arm64 glibc Linux, macOS, and Windows; unsupported targets fail before installation and can opt down with explicit `--preset` flags that exclude `effect`.

It commits a separate `.oxfmtrc.json` when no formatter config exists, with `singleQuote: true` and `semi: false`; JSON/JSONC Oxfmt configs keep their other settings while those two project-style settings are enforced. Existing `oxfmt.config.ts` or `oxfmt.config.mts` files require a manual merge. The initializer adds `lint`, `lint:fix`, `fmt`, and `fmt:check` scripts only when missing, preserving conflicting local scripts. For `all` or `effect`, it also patches Oxlint's type-aware backend and persists the patch in `prepare`; an existing `prepare` command is retained and the patch is appended idempotently so later clean installs remain patched. Use `--skip-install` when dependencies are already managed separately; if they are not present yet, run `effect-tsgo patch --no-typescript --oxlint` after installing them.

This follows Oxc's supported auto-discovery for committed [Oxlint configuration](https://oxc.rs/docs/guide/usage/linter/config.html) and separate [Oxfmt configuration](https://oxc.rs/docs/guide/usage/formatter/config.html). The custom `quality` plugin is registered through Oxlint `jsPlugins`, which Oxc currently labels alpha.

## Presets

| Preset | Policy |
| --- | --- |
| `recommended` | Conservative correctness baseline, `core`, and cyclomatic complexity capped at 12 |
| `core` | Portable quality rules, explicit arrow-function returns, braced control flow, and complexity capped at 12 |
| `type-safety` | Assertion evidence, widening, `unknown`, dictionary, and TypeScript syntax policy |
| `type-aware` | Adopted `typescript/no-unsafe-*` rules with `options.typeAware: true` |
| `boundaries` | Boundary parsing, reflection, generic record guards, and type predicates |
| `testing` | Real dependency seams instead of module mocking |
| `architecture` | Exported-type boundary policy |
| `react-next` | Stricter adopted React, Hooks, JSX accessibility, and Next.js settings |
| `effect` | `type-aware`, adopted Effect overrides, and all five `@effect/tsgo` presets |
| `strict` | High-friction pedantic policy, including no assertions and extensionless relative code imports |
| `all` | Every compatible preset; the default for `defineConfig()` and the initializer |

`type-aware` requires TypeScript 7 and `oxlint-tsgolint`. `effect` additionally requires `@effect/tsgo`. The initializer installs these with the default `all` policy; explicit subsets install only the tooling they need.

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
| Boundaries | `no-generic-record-guard` | Prefer downstream TypeScript inference to generic record guards and programmatic type checks; do not replace them with `as` casts |
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
