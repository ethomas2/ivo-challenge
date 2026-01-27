const { z } = require("zod");

const schema = z.object({ animal: z.string() });

function marshallToString(parsed) {
  return parsed.animal;
}

module.exports = { schema, marshallToString };
