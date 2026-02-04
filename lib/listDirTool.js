const fs = require("fs/promises");
const path = require("path");
const { z } = require("zod");

const listDirSchema = z.object({
  type: z.literal("listDir"),
  path: z.string().describe("Directory path relative to the challenge directory (e.g. 'files' or '.')."),
});
listDirSchema.type = "listDir";

const listDirTool = {
  name: "listDir",
  description:
    "List directory entries (files and subdirs) at a path relative to the challenge directory. Returns array of entry names.",
  schema: listDirSchema,
  handler: async ({ path: dirPath }, { cwd = process.cwd(), signal } = {}) => {
    const p = dirPath != null ? String(dirPath) : ".";
    const root = path.resolve(cwd);
    const full = path.resolve(cwd, p);
    if (!full.startsWith(root)) {
      return "Error: path escapes challenge directory";
    }
    try {
      const entries = await fs.readdir(full, { withFileTypes: false });
      if (signal?.aborted) throw new Error("Operation aborted");
      return JSON.stringify(entries);
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};
listDirTool.type = "listDir";

module.exports = { listDirTool };
