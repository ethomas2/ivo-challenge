/**
 * Sort items by value lexicographically. Returns [{key, value}, ...] sorted by value (smallest first).
 * Agent picks the smallest as the first element.
 */
const sortTool = {
  type: "function",
  name: "sort",
  description:
    "Sort an array of {key, value} items lexicographically by value. Returns the sorted array with smallest value first.",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string", description: "Label (e.g. file path)" },
            value: { type: "string", description: "Value to sort by (e.g. hash)" },
          },
          required: ["key", "value"],
          additionalProperties: false,
        },
        description: "Items to sort, each with key and value",
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
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
    return JSON.stringify(sorted);
  },
};

module.exports = { sortTool };
