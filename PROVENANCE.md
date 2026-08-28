# Rule provenance

The initial package snapshot was assembled on 2026-08-27 from policies already adopted by the following repositories.

| Source | Revision | Adopted material |
| --- | --- | --- |
| `dakdevs/dak.dev-2026` (`main`) | `bff1f55546891403607a6c667bbdbde47e1eaca1` | `.oxlintrc.json`, `tooling/oxlint/boundaries.mts` |
| `itstechnight/itstechnight-web` (`production`) | `6d1e1ce799dcecb5987e131fa112084761ce06a3` | `apps/web/.oxlintrc.json`, vendored anti-slop plugin |
| `Reverie-Development-Inc/openfactory` (`codex/effect-plugin-runtime`) | `29cfc020c97092670601997eadf0a111cc8875bd` | `.oxlintrc.json`, `tooling/oxlint/type-discipline.ts` |

The anti-slop-derived files trace back to [`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop), inspected at revision `6d538555cb151d4121ed51a27db81890eacf8ae9`. Its MIT attribution is retained in `NOTICE`.

Original plugin namespaces (`anti-slop`, `boundaries`, and `type-discipline`) are normalized to `quality`. The two behaviorally equivalent `no-generic-record-guard` implementations are represented by one canonical rule using the typed `@oxlint/plugins` form. Source configuration fixtures remain under `test/fixtures/source-configs/` and are checked for representation by the `all` preset.
