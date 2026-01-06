const ivm = require("isolated-vm");
const ts = require("typescript");
const { readHelper } = require("../lib/toolbox");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const globalsModule = require("./modules/globals");
const logModule = require("./modules/log");
const fsModule = require("./modules/fs");


async function runTs(helpers, code, { cwd = process.cwd(), signal } = {}) {
  if (process.env.DEBUG) {
    console.log("runTs", helpers, code);
  }
  if (signal?.aborted) {
    throw new Error("Operation aborted");
  }

  const helperContents = await Promise.all(helpers.map((h) => readHelper(h)));
  const totalCode = [...helperContents, code].join("\n\n//----\n\n");

  

  // Transpile TypeScript to JavaScript
  const transpileResult = ts.transpileModule(totalCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  });
  const jsCode = transpileResult.outputText;

  // Create Isolate
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = isolate.createContextSync();
  const jail = context.global;

  if (signal) {
    signal.addEventListener("abort", () => {
      if (!isolate.isDisposed) {
        isolate.dispose();
      }
    });
  }

  // Setup Global Scope
  jail.setSync("global", jail.derefInto());

  // Register Modules
  await globalsModule.register(context);

  const logs = [];
  await logModule.register(context, { logs });

  await fsModule.register(context, { cwd });
  

  try {
    // Run the code and wait for promises
    const startTime = Date.now();
    await context.eval(jsCode, { promise: true });
    if (process.env.DEBUG) {
      console.log("Code ran in", Date.now() - startTime, "ms");
    }
  } catch (err) {
    if (signal?.aborted && isolate.isDisposed) {
      throw new Error("Operation aborted");
    }
    logs.push(err.toString());
  }

  // Clean up
  if (!isolate.isDisposed) {
    isolate.dispose();
  }

  return logs.join("\n");
}

const runTsTool = {
  type: "function",
  name: "runTs",
  description: "Run TypeScript code with helpers.",
  parameters: {
    type: "object",
    properties: {
      helpers: {
        type: "array",
        items: { type: "string" },
        description: "List of helper filenames to include",
      },
      code: {
        type: "string",
        description: "The full TypeScript code to run",
      },
    },
    required: ["helpers", "code"],
    additionalProperties: false,
  },
  handler: async ({ helpers, code }, { cwd, signal } = {}) => {
    return await runTs(helpers, code, { cwd, signal });
  },
};

module.exports = { runTs, runTsTool };
