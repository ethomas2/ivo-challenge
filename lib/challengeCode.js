const path = require("path");
const fs = require("fs");
const { z } = require("zod");

const defaultSchema = z.object({ answer: z.string() });
const defaultMarshallToString = (p) => String(p.answer ?? "");

const challengesPath = path.join(__dirname, "..", "challenges");
const challengeDirs = fs
  .readdirSync(challengesPath)
  .filter((name) => {
    const full = path.join(challengesPath, name);
    return (
      fs.statSync(full).isDirectory() &&
      !name.startsWith(".") &&
      !name.startsWith("_")
    );
  })
  .sort();

const challengeCodeByDir = {};
for (const dir of challengeDirs) {
  const codePath = path.join(challengesPath, dir, "challenge_code.js");
  if (fs.existsSync(codePath)) {
    try {
      const code = require(codePath);
      if (
        code &&
        typeof code.schema !== "undefined" &&
        typeof code.marshallToString === "function"
      ) {
        challengeCodeByDir[dir] = {
          schema: code.schema,
          marshallToString: code.marshallToString,
        };
      }
    } catch (e) {
      // skip this dir, use default when requested
    }
  }
}

/**
 * Return { schema, marshallToString } for the given challenge dir (e.g. "000", "001").
 * Uses preloaded challenge_code.js from all dirs; falls back to default if missing.
 */
function loadChallengeCode(challengeDir) {
  const loaded = challengeCodeByDir[challengeDir];
  if (loaded) return loaded;
  return { schema: defaultSchema, marshallToString: defaultMarshallToString };
}

module.exports = { loadChallengeCode };
