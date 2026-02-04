const fs = require("fs/promises");
const path = require("path");
const { diffWords } = require("diff");
const { z } = require("zod");

/**
 * Produce word-level diff between two files (paths relative to cwd).
 */
const diffSchema = z.object({
  type: z.literal("diff"),
  pathA: z
    .string()
    .describe("First file path (relative to challenge directory)."),
  pathB: z
    .string()
    .describe("Second file path (relative to challenge directory)."),
});
diffSchema.type = "diff";

const diffTool = {
  name: "diff",
  description:
    "Produce a word-level diff between two files. Pass pathA and pathB (relative to the challenge directory). Returns JSON array of { word, type } where type is 'added' or 'removed'.",
  schema: diffSchema,
  handler: async ({ pathA, pathB }, { cwd = process.cwd(), signal } = {}) => {
    if (!pathA?.trim() || !pathB?.trim()) {
      return "Error: provide pathA and pathB";
    }
    const root = path.resolve(cwd);
    for (const p of [pathA, pathB]) {
      const full = path.resolve(cwd, p);
      if (!full.startsWith(root)) {
        return `Error: path escapes challenge directory: ${p}`;
      }
    }
    const a = await fs.readFile(path.resolve(cwd, pathA), "utf-8");
    if (signal?.aborted) throw new Error("Operation aborted");
    const b = await fs.readFile(path.resolve(cwd, pathB), "utf-8");
    const changes = diffWords(a, b);
    const diffs = changes
      .filter((part) => part.added || part.removed)
      .map((part) => ({
        word: part.value.trim(),
        type: part.removed ? "removed" : "added",
      }));
    return JSON.stringify(diffs);
  },
};
diffTool.type = "diff";

module.exports = { diffTool };
