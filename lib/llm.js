const fs = require("fs/promises");
const path = require("path");
const OpenAI = require("openai");
const { zodTextFormat } = require("openai/helpers/zod");
const { z } = require("zod");

const openai = new OpenAI();

async function writeDebugLog(cwd, chatLog, model, extractedResult) {
  if (chatLog.length === 0) return;
  const logsDir = path.resolve(cwd, "logs");
  await fs.mkdir(logsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logsDir, `${timestamp}.json`);
  const logData = {
    model,
    chatLog,
    ...(extractedResult && { result: extractedResult }),
  };
  await fs.writeFile(logPath, JSON.stringify(logData, null, 2), "utf-8");
}

const Thinking = z.object({
  type: z.literal("thinking"),
  thoughts: z.string().describe("Your reasoning or thought process"),
  complexity: z
    .enum(["high", "low"])
    .describe(
      'An indication of how complex the task is given the info we already have. "high" indicates relatively complex reasoning, multi-step logic, code writing, or careful analysis (best for a stronger model). low: straightforward task, simple extraction, or single-step (fine for a smaller model).',
    ),
});
Thinking.type = "thinking";

const Answer = z.object({
  type: z.literal("answer"),
  reasoning: z
    .string()
    .describe(
      'Brief explanation of how you derived the answer from the tool results (e.g. "Sum of the numbers from readFile", "First element of the sorted list", "Row from sqlite query").',
    ),
  answer: z.string().describe("The final answer ONLY. No extra text."),
});
Answer.type = "answer";

function buildResponseSchema(tools) {
  const allSchemas = [Thinking, Answer, ...tools.map((t) => t.schema)];
  const types = [Thinking, Answer, ...tools].map((x) => x.type);
  const Response = z.object({
    response: z.discriminatedUnion("type", allSchemas),
  });
  const typeEnum = z.enum(types);
  return { Response, typeEnum };
}

function omit(obj, key) {
  const { [key]: _, ...rest } = obj;
  return rest;
}

/**
 * Query a LLM and run any tool calls it invokes
 *
 * This function may engage in several "rounds" to the llm. Each time it sends a request to the llm may respond with type
 *    Answer | Thinking | ... one of many tools ...
 *
 * If the response is type Answer, we simply return. Response of type Thinking
 * is used to allow the llm to reflect upon the output of a tool call. E.g. it
 * may want to run a sql query to look at all teh schemas, and then stop and
 * plan next steps. If it wants to run a tool call, it can do so by returning a
 * response for a tool. Unfortunately we can't use openai's native support for
 * tool calling at the same time as using structured output, so we handle the
 * tool calling ourselves. Each tool call has a zod schema that it defines, and the Response type
 * we send to openai is a discriminated union over Answer | Thinking | ... tools ...
 * */
const MODEL_MINI = "gpt-4o-mini";
const MODEL_COMPLEX = "gpt-5";

async function query(
  systemPrompt,
  {
    model = null,
    tools = [],
    maxRounds = 20,
    cwd = process.cwd(),
    deadlineSecs = 60,
  } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), deadlineSecs * 1000);
  const { signal } = controller;
  let chatLog;
  let extractedResult = null;

  // ALlow dynamic switching of the model if the caller did not explicitly pass
  // in a model
  const allow_dynamic_model = model === null;
  model = model || MODEL_MINI;

  const { Response } = buildResponseSchema(tools);

  try {
    chatLog = [{ role: "user", content: systemPrompt }];
    const CONTINUE_PROMPT =
      "Continue. You may think, call a tool, or give your final answer.";

    let parsed_response = (
      await openai.responses.parse(
        {
          model,
          input: chatLog,
          text: { format: zodTextFormat(Response, "response") },
        },
        { signal },
      )
    ).output_parsed;

    for (let round = 0; round < maxRounds; round++) {
      if (signal.aborted) {
        throw new Error("Query aborted due to deadline exceeded");
      }

      const r = parsed_response?.response;
      if (!r) {
        break;
      }

      if (r.type === "thinking") {
        if (allow_dynamic_model) {
          model = r.complexity === "high" ? MODEL_COMPLEX : MODEL_MINI;
        }
        chatLog.push({ role: "assistant", content: JSON.stringify(r) });
        chatLog.push({ role: "user", content: CONTINUE_PROMPT });
        const nextResponse = await openai.responses.parse(
          {
            model,
            input: chatLog,
            text: { format: zodTextFormat(Response, "response") },
          },
          { signal },
        );
        parsed_response = nextResponse.output_parsed;
        continue;
      }

      if (r.type === "answer") {
        extractedResult = { answer: r.answer, reasoning: r.reasoning };
        chatLog.push({ role: "assistant", content: JSON.stringify(r) });
        return {
          finalResponse: JSON.stringify(r),
          parsed: r,
          answer: r.answer,
          chatLog,
        };
      }

      // Tool call
      const tool = tools.find((t) => t.name === r.type);
      if (!tool) {
        chatLog.push({
          role: "assistant",
          content: JSON.stringify({
            type: "error",
            message: `Unknown tool: ${r.type}`,
          }),
        });
        chatLog.push({ role: "user", content: CONTINUE_PROMPT });
        const nextResponse = await openai.responses.parse(
          {
            model,
            input: chatLog,
            text: { format: zodTextFormat(Response, "response") },
          },
          { signal },
        );
        parsed_response = nextResponse.output_parsed;
        continue;
      }

      const params = omit(r, "type");
      let result;
      try {
        result = await tool.handler(params, { cwd, signal });
      } catch (e) {
        result = `Error executing tool: ${e.message}`;
      }

      chatLog.push({ role: "assistant", content: JSON.stringify(r) });
      chatLog.push({
        role: "user",
        content: `Tool result:\n${typeof result === "string" ? result : JSON.stringify(result)}\n\n${CONTINUE_PROMPT}`,
      });

      const nextResponse = await openai.responses.parse(
        {
          model,
          input: chatLog,
          text: { format: zodTextFormat(Response, "response") },
        },
        { signal },
      );
      parsed_response = nextResponse.output_parsed;
    }

    return {
      finalResponse: "Max rounds reached without final answer.",
      chatLog,
    };
  } finally {
    clearTimeout(timeout);
    if (chatLog && chatLog.length > 0) {
      await writeDebugLog(cwd, chatLog, model, extractedResult);
    }
  }
}

module.exports = { query, buildResponseSchema };
