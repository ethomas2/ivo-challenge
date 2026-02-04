const fs = require("fs/promises");
const path = require("path");
const { z } = require("zod");

const MAX_OUTPUT = 1000;

const readFileSchema = z.object({
  type: z.literal("readFile"),
  path: z.string().describe("File path relative to the challenge directory."),
});
readFileSchema.type = "readFile";

const readFileTool = {
  name: "readFile",
  description: `Read the contents of a file as UTF-8 text.
     Path is relative to the challenge directory. Use this to read local files.
     This tool will ONLY display the first ${MAX_OUTPUT} characters of text from the
     file, so it is safe to call even on very large files`,
  schema: readFileSchema,
  handler: async ({ path: filePath }, { cwd = process.cwd(), signal } = {}) => {
    const p = filePath != null ? String(filePath) : "";
    const root = path.resolve(cwd);
    const full = path.resolve(cwd, p);
    if (!full.startsWith(root)) {
      return "Error: path escapes challenge directory";
    }
    try {
      const contents = await fs.readFile(full, "utf-8");
      if (signal?.aborted) throw new Error("Operation aborted");
      if (contents.length > MAX_OUTPUT) {
        return `OUTPUT HAS BEEN TRUNCATED TO FIRST ${MAX_OUTPUT} chars\n\n${contents.slice(0, MAX_OUTPUT)}`;
      }
      return contents;
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};
readFileTool.type = "readFile";

module.exports = { readFileTool };
