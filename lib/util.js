const fs = require("fs/promises");
const { encrypt, decrypt } = require("./crypt");

async function exists(fileName) {
  try {
    await fs.access(fileName);
    return true;
  } catch {
    return false;
  }
}

async function encryptAnswers(challengeDirs) {
  const hasAnswer = await Promise.all(
    challengeDirs.map((d) => exists(`./challenges/${d}/answer.txt`))
  );
  const hasAnswerEnc = await Promise.all(
    challengeDirs.map((d) => exists(`./challenges/${d}/answer.enc.txt`))
  );
  for (let i = 0; i < challengeDirs.length; i++) {
    const d = challengeDirs[i];
    if (hasAnswer[i] && !hasAnswerEnc[i]) {
      console.log(`Encrypting answer for challenge ${d}`);
      const contents = await fs.readFile(
        `./challenges/${d}/answer.txt`,
        "utf-8"
      );
      const trimmed = contents.trim();
      const encrypted = encrypt(Buffer.from(trimmed), trimmed);
      await fs.writeFile(`./challenges/${d}/answer.enc.txt`, encrypted);
    }
  }
}

async function checkAnswer(challengeDir, answer) {
  try {
    const encrypted = await fs.readFile(
      `./challenges/${challengeDir}/answer.enc.txt`
    );
    const decrypted = decrypt(encrypted, answer);
    return decrypted.toString() === answer;
  } catch {
    return false;
  }
}

async function checkAnswers(challengeDirs) {
  const results = [];
  for (const d of challengeDirs) {
    const answerPath = `./challenges/${d}/answer.txt`;
    if (await exists(answerPath)) {
      const contents = await fs.readFile(answerPath, "utf-8");
      const answer = contents.trim();
      const isCorrect = await checkAnswer(d, answer);
      results.push({
        dir: d,
        status: isCorrect,
        answer: answer,
        time: 0,
      });
    } else {
      results.push({
        dir: d,
        status: null,
        answer: null,
        time: 0,
      });
    }
  }
  return results;
}

async function clearAnswers(challengeDirs) {
  await Promise.all(
    challengeDirs.map(async (dir) => {
      try {
        await fs.unlink(`./challenges/${dir}/answer.txt`);
      } catch (e) {
        // File might not exist, that's okay
      }
    })
  );
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function printResults(results) {
  const tableData = results.map((r) => {
    let statusEmoji = "";
    if (r.status === true) statusEmoji = "✅";
    else if (r.status === false) statusEmoji = "❌";

    return {
      challenge: r.dir,
      status: statusEmoji,
      answer: r.answer || "",
      time: r.time ? r.time.toFixed(2) + "s" : "",
    };
  });

  console.table(tableData);

  const total = results.length;
  const correct = results.filter((r) => r.status === true).length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  console.log(`Summary: ${percent}% correct (${correct}/${total})`);

  const times = results.map((r) => r.time).filter((t) => t > 0);
  if (times.length > 0) {
    times.sort((a, b) => a - b);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const medianTime = median(times);
    const p95 = percentile(times, 95);
    console.log(
      `Time stats (n=${times.length}): Mean=${mean.toFixed(
        2
      )}s, Median=${medianTime.toFixed(2)}s, P95=${p95.toFixed(2)}s`
    );
  }
}

function printAggregateStats(allResults) {
  const challengeDirs = Object.keys(allResults).sort();
  console.log("\n=== AGGREGATE STATISTICS ===\n");

  let totalCorrect = 0;
  let totalAttempts = 0;
  const allTimes = [];

  const tableData = challengeDirs.map((dir) => {
    const results = allResults[dir];
    const correctCount = results.filter((r) => r.isCorrect).length;
    const times = results.map((r) => r.time);
    const medianTime = median(times);
    const p95Time = percentile(times, 95);

    totalCorrect += correctCount;
    totalAttempts += results.length;
    allTimes.push(...times);

    return {
      challenge: dir,
      correct: `${correctCount}/${results.length}`,
      median: medianTime.toFixed(2) + "s",
      p95: p95Time.toFixed(2) + "s",
    };
  });

  console.table(tableData);

  console.log("\n=== OVERALL STATISTICS ===");
  console.log(
    `Total Accuracy: ${totalCorrect}/${totalAttempts} (${(
      (totalCorrect / totalAttempts) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`Median Time: ${median(allTimes).toFixed(2)}s`);
  console.log(`95th Percentile Time: ${percentile(allTimes, 95).toFixed(2)}s`);
  console.log(`Total Time: ${allTimes.reduce((a, b) => a + b, 0).toFixed(2)}s`);
}

exports.checkAnswer = checkAnswer;
exports.checkAnswers = checkAnswers;
exports.encryptAnswers = encryptAnswers;
exports.printResults = printResults;
exports.printAggregateStats = printAggregateStats;
exports.clearAnswers = clearAnswers;
