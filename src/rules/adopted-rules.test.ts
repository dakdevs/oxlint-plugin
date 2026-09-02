import { RuleTester } from "oxlint/plugins-dev";

import { extensionlessRelativeCodeImportsRule } from "./extensionless-relative-code-imports.js";
import { noChainedTypeAssertionsRule } from "./no-chained-type-assertions.js";
import { noExportedTypesRule } from "./no-exported-types.js";
import { noGenericRecordGuardRule } from "./no-generic-record-guard.js";
import { noForbiddenTermInSymbolNamesRule } from "./no-shape-in-symbol-names.js";
import { noTypeAssertionsRule } from "./no-type-assertions.js";
import { noUnjustifiedTypePredicateRule } from "./no-unjustified-type-predicate.js";
import { noUnknownParametersRule } from "./no-unknown-parameters.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run(
  "quality/extensionless-relative-code-imports",
  extensionlessRelativeCodeImportsRule,
  {
    valid: [
      'import value from "./value";',
      'import data from "./data.json";',
      'import value from "package-name";',
    ],
    invalid: [
      {
        code: 'import value from "./value.ts";',
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: 'export * from "../value.js";',
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: 'const value = import("./value.mts");',
        errors: [{ messageId: "forbidden" }],
      },
    ],
  },
);

tester.run(
  "quality/no-chained-type-assertions",
  noChainedTypeAssertionsRule,
  {
    valid: ["const value = input as User;", "const value = [1, 2] as const;"],
    invalid: [
      {
        code: "const value = input as object as User;",
        errors: [{ messageId: "chained" }],
      },
    ],
  },
);

tester.run("quality/no-exported-types", noExportedTypesRule, {
  valid: ["type Local = { id: string };", "export const value = 1;"],
  invalid: [
    {
      code: "export type Public = { id: string };",
      errors: [{ messageId: "noExportedTypes" }],
    },
    {
      code: "export interface Public { id: string }",
      errors: [{ messageId: "noExportedTypes" }],
    },
    {
      code: "type Public = string; export { type Public };",
      errors: [{ messageId: "noExportedTypes" }],
    },
  ],
});

tester.run("quality/no-generic-record-guard", noGenericRecordGuardRule, {
  valid: ["const parsed = Schema.decodeUnknownSync(Input)(value);"],
  invalid: [
    {
      code: "function isRecord(value: unknown) { return value; }",
      errors: [
        {
          message:
            "Let TypeScript infer the type from downstream usage instead of using `isRecord` or another programmatic type check. Do not cast with `as`; only `as const` is allowed.",
        },
      ],
    },
  ],
});

tester.run(
  "quality/no-shape-in-symbol-names",
  noForbiddenTermInSymbolNamesRule,
  {
    valid: ["const userContract = {};"],
    invalid: [
      {
        code: "const userShape = {};",
        errors: [{ messageId: "forbiddenSymbolName" }],
      },
    ],
  },
);

tester.run("quality/no-type-assertions", noTypeAssertionsRule, {
  valid: ["const value = [1, 2] as const;"],
  invalid: [
    {
      code: "const value = input as User;",
      errors: [{ messageId: "forbiddenAssertion" }],
    },
  ],
});

tester.run(
  "quality/no-unjustified-type-predicate",
  noUnjustifiedTypePredicateRule,
  {
    valid: [
      "const parsed = Schema.decodeUnknownSync(Input)(value);",
      "// type-predicate-exception: schema decoding cannot express this boundary\nfunction isValue(value: unknown): value is string { return true; }",
    ],
    invalid: [
      {
        code: "function isValue(value: unknown): value is string { return true; }",
        errors: [{ messageId: "forbidden" }],
      },
    ],
  },
);

tester.run("quality/no-unknown-parameters", noUnknownParametersRule, {
  valid: [
    "function handle(value: Input) {}",
    "function enrich(cause: unknown) {}",
  ],
  invalid: [
    {
      code: "function handle(value: unknown) {}",
      errors: [{ messageId: "unknownParameter" }],
    },
  ],
});
