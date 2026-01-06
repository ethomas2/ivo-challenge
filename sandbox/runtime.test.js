const { runTs } = require("./runtime");
const fs = require("fs/promises");
const path = require("path");

describe("runtime", () => {
  test("runTs should execute code with helpers", async () => {
    const code = `
      const result = add("123", "456");
      console.log(result);
    `;
    const output = await runTs(["big_int_math.ts"], code);
    expect(output).toContain("579");
  });

  test("runTs should handle multiple log statements", async () => {
    const code = `
      console.log("start");
      console.log("end");
    `;
    const output = await runTs([], code);
    expect(output).toContain("start");
    expect(output).toContain("end");
  });

  test("runTs should catch errors", async () => {
    const code = `
      throw new Error("oops");
    `;
    const output = await runTs([], code);
    expect(output).toContain("Error: oops");
  });

  test("runTs should prevent requiring unsupported modules", async () => {
    const code = `
      const inspector = require('node:inspector');
    `;
    const output = await runTs([], code);
    expect(output).toContain("Cannot require module node:inspector");
  });

  test("runTs should allow requiring supported modules", async () => {
    const code = `
      const fs = require('fs');
      console.log(typeof fs.readFileSync);
    `;
    const output = await runTs([], code);
    expect(output).toContain("function");
  });

  test("runTs should allow reading files in cwd via readFile helper", async () => {
    const testDir = path.join(__dirname, "..", "test_challenges", "000");
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, "test.txt"), "hello world");

    const code = `
      const content = readFile("test.txt", "utf-8");
      console.log(content);
    `;

    try {
      const output = await runTs(["file.ts"], code, { cwd: testDir });
      expect(output).toContain("hello world");
    } finally {
      await fs.rm(path.join(__dirname, "..", "test_challenges"), {
        recursive: true,
        force: true,
      });
    }
  });

  test("runTs should prevent reading files outside cwd", async () => {
    const testDir = path.join(__dirname, "..", "test_challenges", "001");
    await fs.mkdir(testDir, { recursive: true });

    // Attempt to read a file from the parent directory (which is where package.json is likely to be)
    // assuming the test runs in 'test_challenges/001'

    const code = `
      try {
        const content = readFile("../../../package.json");
        console.log(content);
      } catch (e: any) {
        console.log(e.message);
      }
    `;

    try {
      const output = await runTs(["file.ts"], code, { cwd: testDir });
      expect(output).toContain("Access denied");
    } finally {
      await fs.rm(path.join(__dirname, "..", "test_challenges"), {
        recursive: true,
        force: true,
      });
    }
  });

  test("runTs should support cancellation", async () => {
    const code = `
      while(true) {}
    `;
    const controller = new AbortController();
    const promise = runTs([], code, { signal: controller.signal });

    setTimeout(() => controller.abort(), 100);

    await expect(promise).rejects.toThrow("Operation aborted");
  });

  
});
