import { defineRule } from "@oxlint/plugins";

/** Keep type declarations local and derive cross-module contracts from values. */
export const noExportedTypesRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Keep type declarations local and derive cross-module contracts from values or function signatures.",
    },
    messages: {
      noExportedTypes:
        "Do not export types. Keep the type local or derive it from a value or function signature at the call site.",
    },
    schema: [],
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (
          node.declaration?.type === "TSInterfaceDeclaration" ||
          node.declaration?.type === "TSTypeAliasDeclaration"
        ) {
          context.report({
            node: node.declaration.id,
            messageId: "noExportedTypes",
          });
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === "ExportSpecifier" &&
            specifier.exportKind === "type"
          ) {
            context.report({
              node: specifier.local,
              messageId: "noExportedTypes",
            });
          }
        }
      },
    };
  },
});
