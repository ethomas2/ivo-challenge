const { z } = require("zod");

// Use string: the product exceeds Number.MAX_SAFE_INTEGER
const schema = z.object({ product: z.string() });

function marshallToString(parsed) {
  return parsed.product;
}

module.exports = { schema, marshallToString };
