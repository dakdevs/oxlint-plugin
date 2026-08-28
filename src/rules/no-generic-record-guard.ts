import { defineRule } from "@oxlint/plugins";

const forbiddenGuardName = ["is", "Record"].join("");

/** Require explicit schemas at unknown-data boundaries instead of generic record guards. */
export const noGenericRecordGuardRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require explicit schemas at unknown-data boundaries instead of generic record guards.",
    },
    messages: {
      forbidden:
        "Decode the boundary with an explicit schema instead of a generic record guard.",
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
