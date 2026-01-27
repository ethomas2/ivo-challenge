const fs = require("fs/promises");
const path = require("path");

const listDirTool = {
  type: "function",
  name: "listDir",
  description:
    "List directory entries (files and subdirs) at a path relative to the challenge directory. Returns array of entry names.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Directory path relative to the challenge directory (e.g. 'files' or '.').",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
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

module.exports = { listDirTool };
