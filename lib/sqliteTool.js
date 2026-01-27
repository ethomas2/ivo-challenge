const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const sqliteTool = {
  type: "function",
  name: "sqlite",
  description:
    "Run a read-only SQL query on a SQLite database file. dbPath is relative to the challenge directory. Returns JSON array of rows (objects keyed by column names).",
  parameters: {
    type: "object",
    properties: {
      dbPath: {
        type: "string",
        description: "Path to .sqlite file relative to the challenge directory.",
      },
      query: {
        type: "string",
        description: "SQL query (e.g. SELECT ...).",
      },
    },
    required: ["dbPath", "query"],
    additionalProperties: false,
  },
  handler: async ({ dbPath, query: sql }, { cwd = process.cwd(), signal } = {}) => {
    const root = path.resolve(cwd);
    const full = path.resolve(cwd, dbPath);
    if (!full.startsWith(root)) {
      return "Error: path escapes challenge directory";
    }
    if (signal?.aborted) throw new Error("Operation aborted");
    try {
      const db = new DatabaseSync(full, { readOnly: true });
      const stmt = db.prepare(sql);
      const rows = stmt.all();
      db.close();
      return JSON.stringify(rows);
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};

module.exports = { sqliteTool };
