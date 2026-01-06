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
const { TaskQueue } = require("./lib/taskQueue");

function parseArgs() {
  const args = process.argv.slice(2);
  let iterations = 0;
  for (const arg of args) {
    if (arg.startsWith("--iterations=")) {
      iterations = parseInt(arg.split("=")[1], 10);
    }
  }
  return { iterations };
}

async function runChallenge(i, challengeDir, systemPrompt, tools) {
  const questionPath = `./challenges/${challengeDir}/question.md`;
  const contents = await fs.readFile(questionPath, "utf-8");
  const question = contents.trim();
  const prompt = systemPrompt.replaceAll("{question}", question);
  let answer;
  const start = Date.now();
  try {
    const { finalResponse } = await query(prompt, {
      model: "gpt-5",
      tools,
      maxToolCalls: 30,
      cwd: `./challenges/${challengeDir}`,
      deadlineSecs: 60,
    });
    answer = finalResponse.trim();
  } catch (e) {
    answer = e.toString();
  }
  const time = (Date.now() - start) / 1000;
  const isCorrect = await checkAnswer(challengeDir, answer);
  console.log(challengeDir, answer, isCorrect, time);
  if (isCorrect) {
    await fs.writeFile(`./challenges/${challengeDir}/answer.txt`, answer);
  }
  return { i, answer, isCorrect, time };
}

async function runIteration(challengeDirs, systemPrompt, tools, skipCorrect) {
  const results = await checkAnswers(challengeDirs);
  console.log("Initial results");
  printResults(results);

  const q = new TaskQueue(4); // Run 4 challenges in parallel at a time
  for (let i = 0; i < challengeDirs.length; i++) {
    q.pushTask(async () => {
      if (skipCorrect && results[i].status) {
        return;
      }
      const result = await runChallenge(i, results[i].dir, systemPrompt, tools);
      results[i].answer = result.answer;
      results[i].status = result.isCorrect;
      results[i].time = result.time;
    });
  }
  await q.all();

  console.log("Final results");
  printResults(results);
  return results;
}

async function main() {
  const { iterations } = parseArgs();
  const challengeDirs = (await fs.readdir("./challenges")).filter(
    (f) => !f.startsWith(".")
  );
  challengeDirs.sort();

  const helpers = await listHelpers();
  const systemPrompt = (await fs.readFile("system_prompt.md", "utf-8"))
    .replaceAll("", "")
    .replaceAll("{helpers}", JSON.stringify(helpers, null, 2));

  await encryptAnswers(challengeDirs);

  const tools = [runTsTool, describeHelperTool];

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
        false
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
    await runIteration(challengeDirs, systemPrompt, tools, true);
  }
}

main();
