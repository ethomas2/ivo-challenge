const { z } = require("zod");

// Total clubs can be large; use string to match answer format
const schema = z.object({ clubs: z.string() });

function marshallToString(parsed) {
  return parsed.clubs;
}

module.exports = { schema, marshallToString };
