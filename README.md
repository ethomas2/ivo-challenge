# Coding Agent Obstacle Course

In the challenges/ directory, there is a set of questions. Your job is to create a LLM agent which answers the questions.

The questions are impossible to answer without writing and running code. Fortunately your LLM agent has access to a JavaScript sandbox, and can execute code.

The agent can solve a few of the questions out of the box. But in order to really win, you're going to need to help it out.

## Rules

-   Each question must be answered in 60 seconds or less.
-   The agent must output **exactly** the correct answer and nothing else.
-   You will be graded on the percent of correct answers, and the median amount of time taken. We will run `pnpm play --iterations=5` and judge the results.
-   **Do not** roll your own crypto!

## Setup

-   Copy `env.template` to `.env` and fill in `OPENAI_API_KEY`.
-   Make sure you have a C++ compiler installed.
-   Install packages with `pnpm i` (or maybe `npm i`, not sure. Haven't tried it.)

## Instructions

Run `pnpm play` to see how your agent performs.

Once your agent has answered a challenge correctly, that challenge will be marked as "solved" (this is achieved by writing the answer to `challenges/.../answer.txt`). This is to help you focus on unsolved challenges. To clear out all recorded answers and run again from a clean slate, either run `reset_answers.sh` or `pnpm play --iterations=1`

To make your agent pass the challenges in time, **you will need to add helpers**. These are in `agent_helpers`. Helpers are written in TypeScript to make life easier for the robot; the rest of the code is written in JavaScript to make life more fun for the humans.

Because the agent's code runs in a sandbox, no dependencies are available by default - this includes builtin node dependencies. **If you want to add dependencies, you'll need to plumb them into the runtime.** Look into `sandbox/runtime.js` to see how that's done - there are a couple of examples there.

**You can edit whatever code you like**, just keep the scoring code in `main.js` intact. You will likely need to add stuff into `agent_helpers`, modify `sandbox`, update `system_prompt.md`, and maybe a bunch of other things. Heck, you can completely rewrite all of this code if you like; just make sure the code execution is still sandboxed.

## Tips

-   Call `reset_answers.sh` fairly regularly to catch regressions.
-   LLMs are non-deterministic. Just because the correct answer was achieved once, doesn't mean it will be achieved again in the future.

## Baseline

This is what the guy who made this test got, over a crappy starlink connection. Surely, you can beat it!

```
=== AGGREGATE STATISTICS ===

┌─────────┬───────────┬─────────┬──────────┬──────────┐
│ (index) │ challenge │ correct │ median   │ p95      │
├─────────┼───────────┼─────────┼──────────┼──────────┤
│ 0       │ '000'     │ '5/5'   │ '13.74s' │ '21.91s' │
│ 1       │ '001'     │ '5/5'   │ '6.82s'  │ '7.55s'  │
│ 2       │ '002'     │ '5/5'   │ '10.26s' │ '12.22s' │
│ 3       │ '003'     │ '5/5'   │ '12.49s' │ '17.24s' │
│ 4       │ '004'     │ '5/5'   │ '16.28s' │ '19.92s' │
│ 5       │ '005'     │ '5/5'   │ '20.19s' │ '21.19s' │
│ 6       │ '006'     │ '5/5'   │ '28.21s' │ '53.58s' │
│ 7       │ '007'     │ '5/5'   │ '35.28s' │ '51.02s' │
│ 8       │ '008'     │ '5/5'   │ '12.30s' │ '14.99s' │
│ 9       │ '009'     │ '5/5'   │ '26.55s' │ '28.18s' │
│ 10      │ '010'     │ '5/5'   │ '21.64s' │ '30.50s' │
│ 11      │ '011'     │ '5/5'   │ '13.47s' │ '26.75s' │
└─────────┴───────────┴─────────┴──────────┴──────────┘

=== OVERALL STATISTICS ===
Total Accuracy: 60/60 (100.0%)
Median Time: 16.93s
95th Percentile Time: 35.28s
Total Time: 1129.75s
```
