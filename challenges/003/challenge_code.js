const { z } = require("zod");

const schema = z.object({ hash: z.string() });

function marshallToString(parsed) {
  return parsed.hash;
}

module.exports = { schema, marshallToString };
