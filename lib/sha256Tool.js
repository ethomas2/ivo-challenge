const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

/**
 * Compute SHA-256 hashes for files or for inline strings.
 * paths: file paths relative to cwd. contents: strings to hash as UTF-8 (e.g. a word from a diff). Pass [] for the one you are not using.
 */
const sha256Tool = {
  type: "function",
  name: "sha256",
  description:
    "Compute SHA-256 hashes. Pass paths (file paths relative to the challenge directory) or contents.  Returns array of { path, hash } or { path: '(inline)', hash } for contents",
  parameters: {
    type: "object",
    properties: {
      paths: {
        type: "array",
        items: { type: "string" },
        description:
          "File paths relative to the challenge directory. Pass [] when using contents.",
      },
      contents: {
        type: "array",
        items: { type: "string" },
        description:
          "Inline strings to hash as UTF-8 (e.g. a word). Pass [] when using paths.",
      },
    },
    required: ["paths", "contents"],
    additionalProperties: false,
  },
  handler: async (
    { paths, contents },
    { cwd = process.cwd(), signal } = {},
  ) => {
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

module.exports = { sha256Tool };
