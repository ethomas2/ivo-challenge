const fs = require("fs/promises");
const path = require("path");
const { createTwoFilesPatch } = require("diff");

/**
 * Produce unified diff between two files (paths under cwd) or two text strings.
 * For "pathA vs pathB": pass pathA, pathB; for inline: pass textA, textB.
 */
const diffTool = {
  type: "function",
  name: "diff",
  description:
    "Produce a unified diff between two files or two text strings. Either pass pathA and pathB (relative to the challenge directory), or textA and textB for inline comparison. Use to find typos or added/removed words between two versions.",
  parameters: {
    type: "object",
    properties: {
      pathA: {
        type: "string",
        description: "First file path (relative to challenge directory). Use with pathB for file diff; pass empty string if using textA/textB.",
      },
      pathB: {
        type: "string",
        description: "Second file path (relative to challenge directory). Use with pathA for file diff; pass empty string if using textA/textB.",
      },
      textA: {
        type: "string",
        description: "First text content. Use with textB when not using file paths; pass empty string when using pathA/pathB.",
      },
      textB: {
        type: "string",
        description: "Second text content. Use with textA when not using file paths; pass empty string when using pathA/pathB.",
      },
    },
    required: ["pathA", "pathB", "textA", "textB"],
    additionalProperties: false,
  },
  handler: async (
    { pathA, pathB, textA, textB },
    { cwd = process.cwd(), signal } = {},
  ) => {
    const usePaths =
      pathA != null &&
      pathB != null &&
      String(pathA).trim() !== "" &&
      String(pathB).trim() !== "";
    const useText =
      textA != null &&
      textB != null &&
      (String(textA) !== "" || String(textB) !== "");
    if (!usePaths && !useText) {
      return "Error: provide either (pathA and pathB) or (textA and textB)";
    }
    if (usePaths && useText) {
      return "Error: provide either paths or texts, not both";
    }

    let a, b, labelA, labelB;
    if (usePaths) {
      const root = path.resolve(cwd);
      for (const p of [pathA, pathB]) {
        const full = path.resolve(cwd, p);
        if (!full.startsWith(root)) {
          return `Error: path escapes challenge directory: ${p}`;
        }
      }
      a = await fs.readFile(path.resolve(cwd, pathA), "utf-8");
      if (signal?.aborted) throw new Error("Operation aborted");
      b = await fs.readFile(path.resolve(cwd, pathB), "utf-8");
      labelA = pathA;
      labelB = pathB;
    } else {
      a = String(textA);
      b = String(textB);
      labelA = "a";
      labelB = "b";
    }
    const patch = createTwoFilesPatch(labelA, labelB, a, b);
    return patch;
  },
};

module.exports = { diffTool };
