const { z } = require("zod");

// Use string: the correct sum exceeds Number.MAX_SAFE_INTEGER
const schema = z.object({ sum: z.string() });

function marshallToString(parsed) {
  return parsed.sum;
}

module.exports = { schema, marshallToString };
