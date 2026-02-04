const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { z } = require("zod");

const MAX_LINES = 100;

const sqliteSchema = z.object({
  type: z.literal("sqlite"),
  dbPath: z.string().describe("Path to .sqlite file relative to the challenge directory."),
  query: z.string().describe("SQL query (e.g. SELECT ...)."),
});
sqliteSchema.type = "sqlite";

const sqliteTool = {
  name: "sqlite",
  description:
    "Run a read-only SQL query on a SQLite database file. dbPath is relative to the challenge directory. Returns JSON object with 'rows' (array of objects keyed by column names, max 100) and 'truncated' (boolean indicating if output was cut).",
  schema: sqliteSchema,
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
      const allRows = stmt.all();
      db.close();
      const truncated = allRows.length > MAX_LINES;
      const rows = truncated ? allRows.slice(0, MAX_LINES) : allRows;
      return JSON.stringify({ rows, truncated });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};
sqliteTool.type = "sqlite";

module.exports = { sqliteTool };
