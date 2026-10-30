import { defineRule } from "@oxlint/plugins";
import type { ESTree } from "@oxlint/plugins";

/** Mark containing values, but not objects that merely contain a function. */
function markContainers(node: ESTree.Node, nested: WeakSet<ESTree.ObjectExpression>) {
  let child = node;
  let parent = child.parent;
  while (parent) {
    if (
      parent.type === "FunctionExpression" ||
      parent.type === "ArrowFunctionExpression" ||
      parent.type === "FunctionDeclaration"
    ) return;
    if (parent.type === "Property" && parent.key === child) return;
    if (parent.type === "ObjectExpression") {
      nested.add(parent);
      return;
    }
    child = parent;
    parent = child.parent;
  }
}

function indentation(text: string, offset: number): string {
  const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
  return text.slice(lineStart, offset).match(/^[\t ]*/u)?.[0] ?? "";
}

export const multilineObjectsRule = defineRule({
  meta: {
    type: "layout",
    docs: {
      description: "Require multiline object literals with multiple properties or nested object/array values.",
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      multiline: "Put this object's properties and closing brace on separate lines.",
    },
  },
  createOnce(context) {
    const nested = new WeakSet<ESTree.ObjectExpression>();
    return {
      ArrayExpression(node) {
        markContainers(node, nested);
      },
      ObjectExpression(node) {
        markContainers(node, nested);
      },
      "ObjectExpression:exit"(node) {
        if (node.properties.length < 2 && !nested.has(node)) return;
        const source = context.sourceCode;
        const opening = source.getFirstToken(node);
        const closing = source.getLastToken(node);
        if (!opening || !closing) return;
        const breaks: ESTree.Node[] = [];
        let previousLine = opening.loc.end.line;
        for (const property of node.properties) {
          if (property.loc.start.line === previousLine) breaks.push(property);
          previousLine = property.loc.end.line;
        }
        const closeOnSameLine = closing.loc.start.line === previousLine;
        if (breaks.length === 0 && !closeOnSameLine) return;
        const indent = indentation(source.text, node.range[0]);
        const newline = source.text.includes("\r\n") ? "\r\n" : "\n";
        function horizontalStart(offset: number): number {
          let start = offset;
          while (start > 0 && (source.text[start - 1] === " " || source.text[start - 1] === "\t")) start -= 1;
          return start;
        }
        const targets = breaks.map((property) => ({
          range: property.range,
          loc: property.loc,
          indentation: `${indent}  `,
        }));
        if (closeOnSameLine) {
          targets.push({ range: closing.range, loc: closing.loc, indentation: indent });
        }
        for (const target of targets) {
          context.report({
            loc: target.loc,
            messageId: "multiline",
            fix(fixer) {
              return fixer.replaceTextRange(
                [horizontalStart(target.range[0]), target.range[0]],
                `${newline}${target.indentation}`,
              );
            },
          });
        }
      },
    };
  },
});
