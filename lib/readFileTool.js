const fs = require("fs/promises");
const path = require("path");

const readFileTool = {
  type: "function",
  name: "readFile",
  description:
    "Read the contents of a file as UTF-8 text. Path is relative to the challenge directory. Use this to read local files (e.g. animal.txt).",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "File path relative to the challenge directory.",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
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
      return contents;
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};

module.exports = { readFileTool };
