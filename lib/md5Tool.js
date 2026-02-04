const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { z } = require("zod");

/**
 * Compute MD5 hashes for multiple files in one call.
 * paths: array of paths relative to cwd; returns array of { path, hash } or { path, error } in same order.
 */
const md5Schema = z.object({
  type: z.literal("md5"),
  paths: z.array(z.string()).describe("File paths relative to the challenge directory"),
});
md5Schema.type = "md5";

const md5Tool = {
  name: "md5",
  description:
    "Compute MD5 hashes for multiple files. Pass an array of paths (relative to the challenge directory). Returns an array of { path, hash } in the same order; failed entries have { path, error }. Use instead of hashing files one-by-one.",
  schema: md5Schema,
  handler: async ({ paths }, { cwd = process.cwd(), signal } = {}) => {
    if (!Array.isArray(paths)) {
      return "Error: paths must be an array of strings";
    }
    const results = [];
    const root = path.resolve(cwd);
    for (const p of paths) {
      if (typeof p !== "string") {
        results.push({ path: String(p), error: "path must be a string" });
        continue;
      }
      const full = path.resolve(cwd, p);
      if (!full.startsWith(root)) {
        results.push({ path: p, error: "path escapes challenge directory" });
        continue;
      }
      try {
        const buf = await fs.readFile(full, null);
        if (signal?.aborted) throw new Error("Operation aborted");
        const hash = crypto.createHash("md5").update(buf).digest("hex");
        results.push({ path: p, hash });
      } catch (e) {
        results.push({ path: p, error: e.message });
      }
    }
    return JSON.stringify(results);
  },
};
md5Tool.type = "md5";

module.exports = { md5Tool };
