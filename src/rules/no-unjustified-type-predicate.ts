import { defineRule } from "@oxlint/plugins";

import type { ESTree, SourceCode } from "@oxlint/plugins";

const exceptionPattern =
  /type-predicate-exception:\s*[^\n]*schema decoding cannot express this boundary/iu;

function hasTypePredicateException(
  sourceCode: SourceCode,
  node: ESTree.TSTypePredicate,
): boolean {
  let current: ESTree.Node = node;
  while (current.parent.type !== "Program") {
    if (
      sourceCode
        .getCommentsBefore(current)
        .some(
          (comment) =>
            comment.end <= node.start && exceptionPattern.test(comment.value),
        )
    ) {
      return true;
    }
    current = current.parent;
  }
  return sourceCode
    .getCommentsBefore(current)
    .some(
      (comment) =>
        comment.end <= node.start && exceptionPattern.test(comment.value),
    );
}

/** Require schema decoding unless a type-predicate boundary exception is documented. */
export const noUnjustifiedTypePredicateRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require schema decoding for type predicates unless an adjacent boundary exception explains why it cannot express the boundary.",
    },
    messages: {
      forbidden:
        "Decode the boundary with an explicit schema, or add an adjacent type-predicate-exception explaining why schema decoding cannot express this boundary.",
    },
    schema: [],
  },
  create(context) {
    return {
      TSTypePredicate(node) {
        if (!hasTypePredicateException(context.sourceCode, node)) {
          context.report({ node, messageId: "forbidden" });
        }
      },
    };
  },
});
