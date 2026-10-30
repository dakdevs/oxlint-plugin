import { RuleTester } from "oxlint/plugins-dev";
import { multilineObjectsRule } from "./multiline-objects.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "tsx" } } });
const error = { messageId: "multiline" };

tester.run("quality/multiline-objects", multilineObjectsRule, {
  valid: [
    "const x = {};",
    "const x = { a: 1 };",
    "const x = { a };",
    "const x = { ...rest };",
    "const x = { text: '{ a: 1, b: 2 }' };",
    "const x = {\n  a: 1,\n  b: 2\n};",
    "const x = {\n  a: {}\n};",
    "const x = {\n  a: []\n};",
    "const x = { a: () => ({ b: 1 }) };",
    "const x = { a() { return { b: 1 }; } };",
    "const x = { [key({ a: 1 })]: 1 };",
    "const { a, b } = x;",
    "import { a, b } from 'pkg';",
    "type X = { a: number; b: number };",
  ],
  invalid: [
    {
      code: "const x = { a: 1, b: 2 };",
      output: "const x = {\n  a: 1,\n  b: 2\n};",
      errors: [error, error, error],
    },
    {
      code: "const x = { a, ...rest };",
      output: "const x = {\n  a,\n  ...rest\n};",
      errors: [error, error, error],
    },
    {
      code: "const x = { a: {} };",
      output: "const x = {\n  a: {}\n};",
      errors: [error, error],
    },
    {
      code: "const x = { a: [] };",
      output: "const x = {\n  a: []\n};",
      errors: [error, error],
    },
    {
      code: "const x = { a: ([1] as const) };",
      output: "const x = {\n  a: ([1] as const)\n};",
      errors: [error, error],
    },
    {
      code: "const x = { a: build({ b: 1 }) };",
      output: "const x = {\n  a: build({ b: 1 })\n};",
      errors: [error, error],
    },
    {
      code: "const x = { a: yes ? {} : other };",
      output: "const x = {\n  a: yes ? {} : other\n};",
      errors: [error, error],
    },
    {
      code: "const x = {\n  a: 1, b: 2\n};",
      output: "const x = {\n  a: 1,\n  b: 2\n};",
      errors: [error],
    },
    {
      code: "const x = { a: 1,\n  b: 2 };",
      output: "const x = {\n  a: 1,\n  b: 2\n};",
      errors: [error, error],
    },
    {
      code: "const x = { /* first */ a: 1, /* second */ b: 2 /* end */ };",
      output: "const x = { /* first */\n  a: 1, /* second */\n  b: 2 /* end */\n};",
      errors: [error, error, error],
    },
    {
      code: "const x = { a: 1, // keep this\n  b: 2 };",
      output: "const x = {\n  a: 1, // keep this\n  b: 2\n};",
      errors: [error, error],
    },
    {
      code: "const x = <Widget options={{ a: 1, b: 2 }} />;",
      output: "const x = <Widget options={{\n  a: 1,\n  b: 2\n}} />;",
      errors: [error, error, error],
    },
    {
      code: "const x = { a: 1, b: 2 };\r\n",
      output: "const x = {\r\n  a: 1,\r\n  b: 2\r\n};\r\n",
      errors: [error, error, error],
    },
    {
      code: "const x = { get a() { return 1; }, b: 2 };",
      output: "const x = {\n  get a() { return 1; },\n  b: 2\n};",
      errors: [error, error, error],
    },
  ],
});
