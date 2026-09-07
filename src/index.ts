import { eslintCompatPlugin } from "@oxlint/plugins";

import { extensionlessRelativeCodeImportsRule } from "./rules/extensionless-relative-code-imports.js";
import { noChainedTypeAssertionsRule } from "./rules/no-chained-type-assertions.js";
import { noConditionalEmptyObjectSpreadRule } from "./rules/no-conditional-empty-object-spread.js";
import { noExportedTypesRule } from "./rules/no-exported-types.js";
import { noGenericRecordGuardRule } from "./rules/no-generic-record-guard.js";
import { noKnownValueWideningRule } from "./rules/no-known-value-widening.js";
import { noModuleMockingRule } from "./rules/no-module-mocking.js";
import { noObjectParametersRule } from "./rules/no-object-parameters.js";
import { noReflectApplyRule } from "./rules/no-reflect-apply.js";
import { noReflectGetRule } from "./rules/no-reflect-get.js";
import { noRuntimeTypeofRule } from "./rules/no-runtime-typeof.js";
import { noForbiddenTermInSymbolNamesRule } from "./rules/no-shape-in-symbol-names.js";
import { noTypeAssertionsRule } from "./rules/no-type-assertions.js";
import { noUnjustifiedTypePredicateRule } from "./rules/no-unjustified-type-predicate.js";
import { noUnknownParametersRule } from "./rules/no-unknown-parameters.js";
import { noUnknownReturnsRule } from "./rules/no-unknown-returns.js";
import { noUnknownTypeAliasesRule } from "./rules/no-unknown-type-aliases.js";
import { noUnsafeDictionaryTypeRule } from "./rules/no-unsafe-dictionary-type.js";
import { noWidenThenAssertRule } from "./rules/no-widen-then-assert.js";
import { paddingLineBetweenStatementsRule } from "./rules/padding-line-between-statements.js";
import { requireSafetyCommentForTypeAssertionRule } from "./rules/require-safety-comment-for-type-assertion.js";

import { ruleCatalog, sourceRevisions } from "./catalog.js";

export const qualityRules = {
  "extensionless-relative-code-imports": extensionlessRelativeCodeImportsRule,
  "no-chained-type-assertions": noChainedTypeAssertionsRule,
  "no-conditional-empty-object-spread": noConditionalEmptyObjectSpreadRule,
  "no-exported-types": noExportedTypesRule,
  "no-generic-record-guard": noGenericRecordGuardRule,
  "no-known-value-widening": noKnownValueWideningRule,
  "no-module-mocking": noModuleMockingRule,
  "no-object-parameters": noObjectParametersRule,
  "no-reflect-apply": noReflectApplyRule,
  "no-reflect-get": noReflectGetRule,
  "no-runtime-typeof": noRuntimeTypeofRule,
  "no-shape-in-symbol-names": noForbiddenTermInSymbolNamesRule,
  "no-type-assertions": noTypeAssertionsRule,
  "no-unjustified-type-predicate": noUnjustifiedTypePredicateRule,
  "no-unknown-parameters": noUnknownParametersRule,
  "no-unknown-returns": noUnknownReturnsRule,
  "no-unknown-type-aliases": noUnknownTypeAliasesRule,
  "no-unsafe-dictionary-type": noUnsafeDictionaryTypeRule,
  "no-widen-then-assert": noWidenThenAssertRule,
  "padding-line-between-statements": paddingLineBetweenStatementsRule,
  "require-safety-comment-for-type-assertion":
    requireSafetyCommentForTypeAssertionRule,
};

const qualityPlugin = eslintCompatPlugin({
  meta: { name: "quality" },
  rules: qualityRules,
});

export { ruleCatalog, sourceRevisions };
export default qualityPlugin;
