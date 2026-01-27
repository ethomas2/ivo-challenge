const { z } = require("zod");

const schema = z.object({ filename: z.string() });

function marshallToString(parsed) {
  return parsed.filename;
}

module.exports = { schema, marshallToString };
