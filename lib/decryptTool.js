const fs = require("fs/promises");
const path = require("path");
const { decrypt } = require("./crypt");

const decryptTool = {
  type: "function",
  name: "decrypt",
  description:
    "Decrypt a file encrypted with AES-256-GCM. Key is sha256(keyInput). Format: first 12 bytes IV, ciphertext, last 16 bytes auth tag. Returns decrypted UTF-8 string.",
  parameters: {
    type: "object",
    properties: {
      cipherPath: {
        type: "string",
        description: "Path to ciphertext file relative to the challenge directory.",
      },
      keyInput: {
        type: "string",
        description: "String to derive key from (key = sha256(keyInput)), e.g. 'banana'.",
      },
    },
    required: ["cipherPath", "keyInput"],
    additionalProperties: false,
  },
  handler: async (
    { cipherPath, keyInput },
    { cwd = process.cwd(), signal } = {},
  ) => {
    const root = path.resolve(cwd);
    const full = path.resolve(cwd, cipherPath);
    if (!full.startsWith(root)) {
      return "Error: path escapes challenge directory";
    }
    try {
      const ciphertext = await fs.readFile(full, null);
      if (signal?.aborted) throw new Error("Operation aborted");
      const msg = decrypt(ciphertext, keyInput);
      return msg.toString("utf-8");
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};

module.exports = { decryptTool };
