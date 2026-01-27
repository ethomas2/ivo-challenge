const { z } = require("zod");

const schema = z.object({ word: z.string() });

function marshallToString(parsed) {
  return parsed.word;
}

module.exports = { schema, marshallToString };
