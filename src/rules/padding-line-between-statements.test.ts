import { RuleTester } from "oxlint/plugins-dev";

import { paddingLineBetweenStatementsRule } from "./padding-line-between-statements.js";

const tester = new RuleTester();

tester.run("quality/padding-line-between-statements", paddingLineBetweenStatementsRule, {
  valid: [
    "function example() {\n  const value = getValue();\n\n  doSomething(value);\n}",
    "function example() {\n  if (ready) {\n    start();\n  }\n\n  finish();\n}",
    "function example() {\n  // explain the value\n  const value = getValue();\n}",
  ],
  invalid: [
    {
      code: "function example() {\n  const value = getValue();\n  doSomething(value);\n}",
      errors: [{ messageId: "between" }],
    },
    {
      code: "function example() {\n\n  doSomething();\n}",
      errors: [{ messageId: "afterOpening" }],
    },
    {
      code: "function example() {\n  doSomething();\n\n}",
      errors: [{ messageId: "beforeClosing" }],
    },
  ],
});
