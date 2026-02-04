const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { z } = require("zod");

/**
 * Compute SHA-256 hashes for files or for inline strings.
 * paths: file paths relative to cwd. contents: strings to hash as UTF-8 (e.g. a word from a diff). Pass [] for the one you are not using.
 */
const sha256Schema = z.object({
  type: z.literal("sha256"),
  paths: z
    .array(z.string())
    .describe(
      "File paths relative to the challenge directory. Prefer this for file hashes (sha256sum). Pass [] when using contents.",
    ),
  contents: z
    .array(z.string())
    .describe(
      "Inline strings to hash (e.g. a word). Not for file contents—use paths instead. Pass [] when using paths.",
    ),
});
sha256Schema.type = "sha256";

const sha256Tool = {
  name: "sha256",
  description:
    "Compute SHA-256 hashes. For file hashes (e.g. sha256sum of a file), always use the `paths` argument—it hashes the exact file bytes. The `contents` argument hashes raw strings and is for inline text (e.g. a word from a diff); do NOT use it for file contents—trailing newlines and encoding can differ.",
  schema: sha256Schema,
  handler: async (
    { paths, contents },
    { cwd = process.cwd(), signal } = {},
  ) => {
    // OpenAI structured output requires all fields; use [] for the unused one
    const hasContents = Array.isArray(contents) && contents.length > 0;
    const hasPaths = Array.isArray(paths) && paths.length > 0;

    if (hasContents) {
      const results = [];
      for (let i = 0; i < contents.length; i++) {
        const s = contents[i];
        const str = s != null ? String(s) : "";
        const buf = Buffer.from(str, "utf8");
        if (signal?.aborted) throw new Error("Operation aborted");
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        results.push({ path: "(inline)", hash });
      }
      return JSON.stringify(results);
    }

    if (!hasPaths) {
      return "Error: provide either paths or contents (non-empty)";
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
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        results.push({ path: p, hash });
      } catch (e) {
        results.push({ path: p, error: e.message });
      }
    }
    return JSON.stringify(results);
  },
};
sha256Tool.type = "sha256";

module.exports = { sha256Tool };
