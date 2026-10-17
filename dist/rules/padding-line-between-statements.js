import { defineRule } from "@oxlint/plugins";
const separatedDeclarations = new Set([
    "FunctionDeclaration",
    "ClassDeclaration",
    "MethodDefinition",
    "TSDeclareFunction",
    "TSInterfaceDeclaration",
    "TSTypeAliasDeclaration",
    "TSEnumDeclaration",
    "TSModuleDeclaration",
]);
function needsSeparation(node) {
    if (node.loc.start.line !== node.loc.end.line)
        return true;
    if (node.type === "ExportNamedDeclaration" ||
        node.type === "ExportDefaultDeclaration") {
        return node.declaration !== null && needsSeparation(node.declaration);
    }
    if (node.type === "VariableDeclaration") {
        return node.declarations.some(({ init }) => init?.type === "ArrowFunctionExpression" ||
            init?.type === "FunctionExpression");
    }
    if (node.type === "PropertyDefinition") {
        return (node.value?.type === "ArrowFunctionExpression" ||
            node.value?.type === "FunctionExpression");
    }
    return separatedDeclarations.has(node.type);
}
export const paddingLineBetweenStatementsRule = defineRule({
    meta: {
        type: "layout",
        docs: {
            description: "Separate multiline constructs and declarations with one blank line; allow compact single-line statements and no padding inside braces.",
        },
        messages: {
            between: "Add a blank line around multiline constructs and declarations.",
            excessive: "Use at most one consecutive blank line between statements.",
            afterOpening: "Remove the blank line after the opening brace.",
            beforeClosing: "Remove the blank line before the closing brace.",
        },
        schema: [],
    },
    createOnce(context) {
        function checkEdges(block, first, last, lines) {
            const sourceCode = context.sourceCode;
            const openingBrace = sourceCode.getFirstToken(block, {
                filter: (token) => token.value === "{",
            });
            const closingBrace = sourceCode.getLastToken(block);
            if (openingBrace &&
                lines
                    .slice(openingBrace.loc.end.line, first.loc.start.line - 1)
                    .some((line) => line.trim() === "")) {
                context.report({ node: first, messageId: "afterOpening" });
            }
            if (closingBrace &&
                lines
                    .slice(last.loc.end.line, closingBrace.loc.start.line - 1)
                    .some((line) => line.trim() === "")) {
                context.report({ node: last, messageId: "beforeClosing" });
            }
        }
        function checkBody(body, block) {
            const first = body[0];
            const last = body[body.length - 1];
            if (!first || !last)
                return;
            const sourceCode = context.sourceCode;
            const lines = sourceCode.text.split(/\r?\n/u);
            const gap = (firstLine, lastLine) => lines.slice(firstLine, lastLine - 1);
            const hasBlank = (line) => line.trim() === "";
            if (block)
                checkEdges(block, first, last, lines);
            for (let index = 1; index < body.length; index += 1) {
                const previous = body[index - 1];
                const current = body[index];
                if (!previous || !current)
                    continue;
                const between = gap(previous.loc.end.line, current.loc.start.line);
                if (between.some((line, index) => hasBlank(line) && between[index + 1]?.trim() === "")) {
                    context.report({ node: current, messageId: "excessive" });
                }
                else if ((needsSeparation(previous) || needsSeparation(current)) &&
                    !between.some(hasBlank)) {
                    context.report({ node: current, messageId: "between" });
                }
            }
        }
        return {
            Program(node) {
                checkBody(node.body);
            },
            BlockStatement(node) {
                checkBody(node.body, node);
            },
            SwitchCase(node) {
                checkBody(node.consequent);
            },
            StaticBlock(node) {
                checkBody(node.body, node);
            },
            TSModuleBlock(node) {
                checkBody(node.body, node);
            },
            ClassBody(node) {
                checkBody(node.body, node);
            },
        };
    },
});
//# sourceMappingURL=padding-line-between-statements.js.map