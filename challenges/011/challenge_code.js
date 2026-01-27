const { z } = require("zod");

const schema = z.object({ firstName: z.string() });

function marshallToString(parsed) {
  return parsed.firstName;
}

module.exports = { schema, marshallToString };
