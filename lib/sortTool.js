const { z } = require("zod");

/**
 * Sort items by value lexicographically. Returns {result, lowest, highest} with smallest value first.
 */
const sortItemSchema = z.object({
  key: z.string().describe("Label (e.g. file path)"),
  value: z.string().describe("Value to sort by (e.g. hash)"),
});

const sortSchema = z.object({
  type: z.literal("sort"),
  items: z.array(sortItemSchema).describe("Items to sort, each with key and value"),
});
sortSchema.type = "sort";

const sortTool = {
  name: "sort",
  description:
    "Sort an array of {key, value} items lexicographically by value. Returns {result, lowest, highest} where lowest is the item with the smallest value and highest is the item with the largest value.",
  schema: sortSchema,
  handler: async ({ items }) => {
    if (!Array.isArray(items)) {
      return "Error: items must be an array of {key, value} objects";
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it == null || typeof it !== "object") {
        return "Error: each item must be an object with key and value";
      }
      if (typeof it.key !== "string" || typeof it.value !== "string") {
        return "Error: each item must have key and value as strings";
      }
    }
    const sorted = [...items].sort((a, b) =>
      a.value < b.value ? -1 : a.value > b.value ? 1 : 0,
    );
    const result = {
      result: sorted,
      lowest: sorted[0] ?? null,
      highest: sorted[sorted.length - 1] ?? null,
    };
    return JSON.stringify(result);
  },
};
sortTool.type = "sort";

module.exports = { sortTool };
