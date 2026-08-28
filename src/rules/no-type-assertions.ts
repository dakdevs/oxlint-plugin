import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

function isConstAssertion(node: TypeAssertion): boolean {
  return (
    node.typeAnnotation.type === "TSTypeReference" &&
    node.typeAnnotation.typeName.type === "Identifier" &&
    node.typeAnnotation.typeName.name === "const"
  );
}

/** Reject TypeScript assertions, while permitting `as const` literal narrowing. */
export const noTypeAssertionsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Reject TypeScript type assertions other than `as const`; model the contract with types, validation, or typed construction instead.",
    },
    messages: {
      forbiddenAssertion:
        "Type assertions are forbidden. Express the contract through validation, inference, or a typed API instead.",
    },
  },
  createOnce(context) {
    const reportAssertion = (node: TypeAssertion) => {
      if (isConstAssertion(node)) return;
      context.report({ node, messageId: "forbiddenAssertion" });
    };

    return {
      TSAsExpression: reportAssertion,
      TSTypeAssertion: reportAssertion,
    };
  },
});
