# Repository guidance

- `src/` is the canonical package implementation; `dist/` is generated.
- Preserve the observable behavior recorded in the rule characterization tests and source fixtures.
- Keep reusable policy in named presets. Repository-specific exceptions belong in consumer overrides, not package presets.
- Every custom rule must have focused `RuleTester` coverage and category/provenance metadata.
- Use Oxlint's ESTree API; do not add another production parser for rules.
- Keep the installer idempotent and preserve unrelated configuration.
- Run `pnpm check` and validate `skills/install-oxlint-quality` before committing.
