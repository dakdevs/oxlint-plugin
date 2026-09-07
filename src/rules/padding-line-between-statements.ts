import { defineRule } from "@oxlint/plugins";

import type { ESTree, SourceCode } from "@oxlint/plugins";

function hasBlankLineBetween(sourceCode: SourceCode, first: ESTree.Node, second: ESTree.Node): boolean {
  const lines = sourceCode.text.split(/\r?\n/u);
  return lines.slice(first.loc.end.line, second.loc.start.line - 1).some((line) => line.trim() === "");
}

function hasPaddingAfter(sourceCode: SourceCode, brace: ESTree.Token, node: ESTree.Node): boolean {
  const lines = sourceCode.text.split(/\r?\n/u);
  return lines.slice(brace.loc.end.line, node.loc.start.line - 1).some((line) => line.trim() === "");
}

function hasPaddingBefore(sourceCode: SourceCode, node: ESTree.Node, brace: ESTree.Token): boolean {
  const lines = sourceCode.text.split(/\r?\n/u);
  return lines.slice(node.loc.end.line, brace.loc.start.line - 1).some((line) => line.trim() === "");
}

/** Require statement separation without allowing padding directly inside block braces. */
export const paddingLineBetweenStatementsRule = defineRule({
  meta: {
    type: "layout",
    docs: {
      description:
        "Require blank lines between block statements, but disallow blank lines directly inside braces.",
    },
    messages: {
      between: "Add a blank line between statements.",
      afterOpening: "Remove the blank line after the opening brace.",
      beforeClosing: "Remove the blank line before the closing brace.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      BlockStatement(node) {
        if (node.body.length === 0) return;
        const sourceCode = context.sourceCode;
        const first = node.body[0];
        const last = node.body[node.body.length - 1];
        if (!first || !last) return;
        const openingBrace = sourceCode.getTokenBefore(first);
        const closingBrace = sourceCode.getTokenAfter(last);

        if (openingBrace && hasPaddingAfter(sourceCode, openingBrace, first)) {
          context.report({ node: first, messageId: "afterOpening" });
        }
        if (closingBrace && hasPaddingBefore(sourceCode, last, closingBrace)) {
          context.report({ node: last, messageId: "beforeClosing" });
        }
        for (let index = 1; index < node.body.length; index += 1) {
          const previous = node.body[index - 1];
          const current = node.body[index];
          if (!previous || !current) continue;
          if (!hasBlankLineBetween(sourceCode, previous, current)) {
            context.report({ node: current, messageId: "between" });
          }
        }
      },
    };
  },
});
