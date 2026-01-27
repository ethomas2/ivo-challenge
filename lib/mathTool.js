/**
 * Add two arbitrary-length integers encoded as base-10 strings.
 */
function add(a, b) {
  let i = a.length - 1;
  let j = b.length - 1;
  let carry = 0;
  const result = [];

  while (i >= 0 || j >= 0 || carry > 0) {
    const digitA = i >= 0 ? parseInt(a[i], 10) : 0;
    const digitB = j >= 0 ? parseInt(b[j], 10) : 0;
    const sum = digitA + digitB + carry;

    result.push(sum % 10);
    carry = Math.floor(sum / 10);

    i--;
    j--;
  }

  return result.reverse().join("") || "0";
}

/**
 * Multiply two arbitrary-length integers encoded as base-10 strings.
 */
function multiply(a, b) {
  if (a === "0" || b === "0") return "0";

  const m = a.length;
  const n = b.length;
  const result = new Array(m + n).fill(0);

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const mul = parseInt(a[i], 10) * parseInt(b[j], 10);
      const p1 = i + j;
      const p2 = i + j + 1;
      const sum = mul + result[p2];

      result[p2] = sum % 10;
      result[p1] += Math.floor(sum / 10);
    }
  }

  let start = 0;
  while (start < result.length && result[start] === 0) {
    start++;
  }

  return result.slice(start).join("") || "0";
}

const mathTool = {
  type: "function",
  name: "bigIntMath",
  description:
    "Add or multiply two arbitrary-length integers given as base-10 strings. Use when numbers exceed normal precision (e.g. very long integer addition or multiplication).",
  parameters: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "multiply"],
        description: "The operation to perform.",
      },
      a: {
        type: "string",
        description: "First base-10 integer (e.g. from the question).",
      },
      b: {
        type: "string",
        description: "Second base-10 integer (e.g. from the question).",
      },
    },
    required: ["operation", "a", "b"],
    additionalProperties: false,
  },
  handler: async ({ operation, a, b }) => {
    if (typeof a !== "string" || typeof b !== "string") {
      return "Error: a and b must be strings";
    }
    if (operation === "add") {
      const result = add(a, b);
      return result;
    }
    if (operation === "multiply") {
      const result = multiply(a, b);
      return result;
    }
    return "Error: operation must be 'add' or 'multiply'";
  },
};

module.exports = { add, multiply, mathTool };
