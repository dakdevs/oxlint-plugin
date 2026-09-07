import { defineRule } from "@oxlint/plugins";
const codeExtension = /\.(?:ts|tsx|js|jsx|mts|mjs)(?:[?#].*)?$/iu;
const relativeSpecifier = /^(?:\.\/|\.\.\/)/u;
function hasForbiddenCodeExtension(source) {
    return relativeSpecifier.test(source.value) && codeExtension.test(source.value);
}
/** Require extensionless relative TypeScript and JavaScript module specifiers. */
export const extensionlessRelativeCodeImportsRule = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Require extensionless relative TypeScript and JavaScript module specifiers.",
        },
        messages: {
            forbidden: "Use an extensionless relative code specifier here. Keep package specifiers and required asset extensions such as .json intact.",
        },
        schema: [],
    },
    create(context) {
        const report = (source) => {
            if (hasForbiddenCodeExtension(source)) {
                context.report({ node: source, messageId: "forbidden" });
            }
        };
        return {
            ExportAllDeclaration(node) {
                report(node.source);
            },
            ExportNamedDeclaration(node) {
                if (node.source !== null)
                    report(node.source);
            },
            ImportDeclaration(node) {
                report(node.source);
            },
            ImportExpression(node) {
                if (node.source.type === "Literal" &&
                    typeof node.source.value === "string") {
                    report(node.source);
                }
            },
            TSImportType(node) {
                report(node.source);
            },
        };
    },
});
//# sourceMappingURL=extensionless-relative-code-imports.js.map