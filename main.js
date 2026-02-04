require("dotenv").config();
const fs = require("fs/promises");
const {
  encryptAnswers,
  checkAnswer,
  checkAnswers,
  printResults,
  printAggregateStats,
  clearAnswers,
} = require("./lib/util");
const { listHelpers } = require("./lib/toolbox");
const { query } = require("./lib/llm");

const { runTsTool } = require("./sandbox/runtime");
const { describeHelperTool } = require("./lib/toolbox");
const { mathTool } = require("./lib/mathTool");
const { sha256Tool } = require("./lib/sha256Tool");
const { md5Tool } = require("./lib/md5Tool");
const { sortTool } = require("./lib/sortTool");
const { diffTool } = require("./lib/diffTool");
const { listDirTool } = require("./lib/listDirTool");
const { readFileTool } = require("./lib/readFileTool");
const { decryptTool } = require("./lib/decryptTool");
const { sqliteTool } = require("./lib/sqliteTool");
const { fetchUrlTool } = require("./lib/fetchUrlTool");
const { TaskQueue } = require("./lib/taskQueue");
/** Serialize tools for prompt (exclude handler and schema, use name/description/type). */
function toolsForPrompt(tools) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    type: t.type,
  }));
}

/** Extract answer from raw response when structured parse fails. Handles JSON, markdown numbers, etc. */
function extractAnswer(raw) {
  const s = (raw ?? "").trim();
  if (!s) return s;
  try {
    const parsed = JSON.parse(s);
    if (parsed && parsed.type === "answer" && typeof parsed.answer === "string")
      return parsed.answer.trim();
    if (parsed && typeof parsed.answer === "string")
      return parsed.answer.trim();
  } catch (_) {}
  const longNums = [...s.matchAll(/[\d,.\s]{15,}/g)];
  if (longNums.length > 0) {
    const last = longNums[longNums.length - 1][0];
    const digits = last.replace(/\D/g, "");
    if (digits.length >= 15) return digits;
  }
  return s;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let iterations = 0;
  let model = null;
  let challenge = null;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--iterations=")) {
      iterations = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
    } else if (arg === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (arg.startsWith("--challenge=")) {
      challenge = arg.slice("--challenge=".length);
    } else if (arg === "--challenge" && args[i + 1]) {
      challenge = args[++i];
    } else if (arg.startsWith("--challenges=")) {
      challenge = arg.slice("--challenges=".length);
    } else if (arg === "--challenges" && args[i + 1]) {
      challenge = args[++i];
    }
  }
  return { iterations, model, challenge };
}

async function runChallenge(i, challengeDir, systemPrompt, tools, model) {
  const questionPath = `./challenges/${challengeDir}/question.md`;
  const contents = await fs.readFile(questionPath, "utf-8");
  const question = contents.trim();
  const prompt = systemPrompt.replaceAll("{question}", question);
  const start = Date.now();
  const result = await query(prompt, {
    model,
    tools,
    maxRounds: 30,
    cwd: `./challenges/${challengeDir}`,
    deadlineSecs: 60,
  });
  const answer = result.answer ?? extractAnswer(result.finalResponse);
  const time = (Date.now() - start) / 1000;
  const isCorrect = await checkAnswer(challengeDir, answer);
  console.log(challengeDir, answer, isCorrect, time);
  if (isCorrect) {
    await fs.writeFile(`./challenges/${challengeDir}/answer.txt`, answer);
  }
  return { i, answer, isCorrect, time };
}

async function runIteration(
  challengeDirs,
  systemPrompt,
  tools,
  skipCorrect,
  model,
) {
  const results = await checkAnswers(challengeDirs);
  console.log("Initial results");
  printResults(results);

  const q = new TaskQueue(4); // Run 4 challenges in parallel at a time
  for (let i = 0; i < challengeDirs.length; i++) {
    q.pushTask(async () => {
      if (skipCorrect && results[i].status) {
        return;
      }
      const taskStart = Date.now();
      try {
        const result = await runChallenge(
          i,
          results[i].dir,
          systemPrompt,
          tools,
          model,
        );
        results[i].answer = result.answer;
        results[i].status = result.isCorrect;
        results[i].time = result.time;
      } catch (e) {
        const time = (Date.now() - taskStart) / 1000;
        results[i].answer = e.message ?? String(e);
        results[i].status = false;
        results[i].time = time;
        console.log(results[i].dir, `[ERROR: ${e.message ?? e}]`, false, time);
      }
    });
  }
  await q.all();

  console.log("Final results");
  printResults(results);
  return results;
}

async function main() {
  const { iterations, model, challenge } = parseArgs();
  let challengeDirs = (await fs.readdir("./challenges")).filter(
    (f) => !f.startsWith("."),
  );
  challengeDirs.sort();
  if (challenge) {
    if (!challengeDirs.includes(challenge)) {
      console.error(
        `Challenge "${challenge}" not found. Available: ${challengeDirs.join(", ")}`,
      );
      process.exit(1);
    }
    challengeDirs = [challenge];
  }

  const tools = [
    mathTool,
    sha256Tool,
    md5Tool,
    sortTool,
    diffTool,
    listDirTool,
    readFileTool,
    decryptTool,
    sqliteTool,
    fetchUrlTool,
  ];
  const systemPrompt = (await fs.readFile("system_prompt.md", "utf-8"))
    .replaceAll("", "")
    .replaceAll("{tools}", JSON.stringify(toolsForPrompt(tools), null, 2));

  await encryptAnswers(challengeDirs);

  if (iterations > 0) {
    const allResults = {};
    challengeDirs.forEach((dir) => {
      allResults[dir] = [];
    });

    for (let iteration = 0; iteration < iterations; iteration++) {
      console.log(`\n=== ITERATION ${iteration + 1}/${iterations} ===\n`);
      await clearAnswers(challengeDirs);

      const results = await runIteration(
        challengeDirs,
        systemPrompt,
        tools,
        false,
        model,
      );

      results.forEach((r) => {
        allResults[r.dir].push({
          isCorrect: r.status,
          time: r.time,
          answer: r.answer,
        });
      });
    }

    printAggregateStats(allResults);
  } else {
    await runIteration(challengeDirs, systemPrompt, tools, true, model);
  }
}

main();
