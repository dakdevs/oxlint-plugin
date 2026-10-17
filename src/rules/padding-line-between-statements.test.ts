import { RuleTester } from "oxlint/plugins-dev";

import { paddingLineBetweenStatementsRule } from "./padding-line-between-statements.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run(
  "quality/padding-line-between-statements",
  paddingLineBetweenStatementsRule,
  {
    valid: [
      "function example() {\n  const value = getValue();\n  doSomething(value);\n  finish();\n}",
      "function example() {\n  const value = getValue();\n\n  doSomething(value);\n}",
      "function example() {\n  if (ready) {\n    start();\n  }\n\n  finish();\n}",
      "function example() {\n  // explain the value\n  const value = getValue();\n}",
      "first(); second(); third();",
      "const first = 1;\nconst second = 2;\nconsume(first, second);",
      "before();\n\nconst value = {\n  ready: true,\n};\n\nafter();",
      "function first() {}\n\nfunction second() {}\n\nclass Example {}",
      "const first = () => 1;\n\nconst second = function () {};",
      "export function first() {}\n\nexport class Example {}",
      "export default function example() {}\n\nconsume();",
      "interface First {}\n\ntype Second = string;\n\nenum Third {}",
      "class Example {\n  first() {}\n\n  second() {}\n}",
      "class Example {\n  first = 1;\n  second = 2;\n}",
      "switch (value) {\n  case 1:\n    first();\n    second();\n    break;\n}",
      "before();\n\n// explain the function\nfunction example() {\n  first();\n  second();\n}\n\nafter();",
      "function example() {\r\n  first();\r\n\r\n  if (ready) {\r\n    second();\r\n  }\r\n}",
      "class Example {\n  first = () => 1;\n\n  second = () => 2;\n}",
      "class Example {\n  static {\n    first();\n    second();\n  }\n}",
      "namespace Example {\n  export function first() {}\n\n  export function second() {}\n}",
      "function empty() {}",
    ],
    invalid: [
      {
        code: "class Example {\n  first = () => 1;\n  second = () => 2;\n}",
        errors: [{ messageId: "between" }],
      },
      {
        code: "namespace Example {\n  export function first() {}\n  export function second() {}\n}",
        errors: [{ messageId: "between" }],
      },
      {
        code: "class Example {\n  static {\n\n    first();\n\n\n    second();\n  }\n}",
        errors: [{ messageId: "afterOpening" }, { messageId: "excessive" }],
      },
      {
        code: "function example() {\n  before();\n  const value = {\n    ready: true,\n  };\n  after(value);\n}",
        errors: [{ messageId: "between" }, { messageId: "between" }],
      },
      {
        code: "function first() {}\nfunction second() {}\nclass Example {}",
        errors: [{ messageId: "between" }, { messageId: "between" }],
      },
      {
        code: "const first = () => 1;\nconst second = function () {};",
        errors: [{ messageId: "between" }],
      },
      {
        code: "export function first() {}\nexport class Example {}",
        errors: [{ messageId: "between" }],
      },
      {
        code: "export default function example() {}\nconsume();",
        errors: [{ messageId: "between" }],
      },
      {
        code: "interface First {}\ntype Second = string;\nenum Third {}",
        errors: [{ messageId: "between" }, { messageId: "between" }],
      },
      {
        code: "class Example {\n  first() {}\n  second() {}\n}",
        errors: [{ messageId: "between" }],
      },
      {
        code: "before();\nconst value = {\n  ready: true,\n};\nafter();",
        errors: [{ messageId: "between" }, { messageId: "between" }],
      },
      {
        code: "switch (value) {\n  case 1:\n    if (ready) {\n      first();\n    }\n    break;\n}",
        errors: [{ messageId: "between" }],
      },
      {
        code: "first();\n\n\nsecond();",
        errors: [{ messageId: "excessive" }],
      },
      {
        code: "function example() {\n  first();\n \t\n\n  second();\n}",
        errors: [{ messageId: "excessive" }],
      },
      {
        code: "function first() {}\n\n\n\nfunction second() {}",
        errors: [{ messageId: "excessive" }],
      },
      {
        code: "first();\n\n\n// explain the function\nfunction example() {}",
        errors: [{ messageId: "excessive" }],
      },
      {
        code: "function example() {\n\n  doSomething();\n}",
        errors: [{ messageId: "afterOpening" }],
      },
      {
        code: "function example() {\n  doSomething();\n\n}",
        errors: [{ messageId: "beforeClosing" }],
      },
      {
        code: "class Example {\n\n  method() {}\n\n}",
        errors: [{ messageId: "afterOpening" }, { messageId: "beforeClosing" }],
      },
      {
        code: "before();\r\nconst value = {\r\n  ready: true,\r\n};\r\nafter();",
        errors: [{ messageId: "between" }, { messageId: "between" }],
      },
    ],
  },
);
