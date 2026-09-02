import { defineRule } from "@oxlint/plugins";

const forbiddenGuardName = ["is", "Record"].join("");

/** Prefer downstream TypeScript inference to generic record guards and type assertions. */
export const noGenericRecordGuardRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prefer downstream TypeScript inference to generic record guards and programmatic type checks without replacing them with type assertions.",
    },
    messages: {
      forbidden:
        "Let TypeScript infer the type from downstream usage instead of using `isRecord` or another programmatic type check. Do not cast with `as`; only `as const` is allowed.",
    },
    schema: [],
  },
  create(context) {
    return {
      Identifier(node) {
        if (node.name === forbiddenGuardName) {
          context.report({ node, messageId: "forbidden" });
        }
      },
    };
  },
});
