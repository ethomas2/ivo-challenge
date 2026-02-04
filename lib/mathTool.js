const { z } = require("zod");

/**
 * Add two arbitrary-length integers encoded as base-10 strings.
 */
function add(a, b) {
  return (BigInt(a) + BigInt(b)).toString();
}

/**
 * Multiply two arbitrary-length integers encoded as base-10 strings.
 */
function multiply(a, b) {
  return (BigInt(a) * BigInt(b)).toString();
}

const mathSchema = z.object({
  type: z.literal("bigIntMath"),
  operation: z.enum(["add", "multiply"]).describe("The operation to perform."),
  a: z.string().describe("First base-10 integer"),
  b: z.string().describe("Second base-10 integer"),
});
mathSchema.type = "bigIntMath";

const mathTool = {
  name: "bigIntMath",
  description:
    "Add or multiply two arbitrary-length integers given as base-10 strings. Use when numbers exceed normal precision (e.g. very long integer addition or multiplication).",
  schema: mathSchema,
  handler: async ({ operation, a, b }) => {
    if (typeof a !== "string" || typeof b !== "string") {
      return "Error: a and b must be strings";
    }
    if (operation === "add") {
      const result = add(a, b);
      return result;
    }
    if (operation === "multiply") {
      const result = multiply(a, b);
      return result;
    }
    return "Error: operation must be 'add' or 'multiply'";
  },
};
mathTool.type = "bigIntMath";

module.exports = { add, multiply, mathTool };
