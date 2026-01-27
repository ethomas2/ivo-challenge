const OpenAI = require("openai");
const { zodTextFormat } = require("openai/helpers/zod");
const debugLog = require("./debug");

const openai = new OpenAI();

// Query a LLM and run any tool calls it invokes. Returns {finalResponse, chatLog} or {finalResponse, parsed} when responseSchema is set
async function query(
  systemPrompt,
  {
    model = "gpt-5",
    tools = [],
    maxToolCalls = 10,
    cwd = process.cwd(),
    deadlineSecs = 60,
    responseSchema = null,
    debug = false,
  } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), deadlineSecs * 1000);
  const { signal } = controller;

  try {
    const apiTools = tools.map((t) => ({
      type: t.type,
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      strict: true,
    }));

    const textFormat = responseSchema
      ? zodTextFormat(responseSchema, "challenge_output")
      : undefined;
    const createBody = (input) => {
      const body = { model, input, tools: apiTools };
      if (textFormat) body.text = { format: textFormat };
      return body;
    };

    const chatLog = [{ role: "user", content: systemPrompt }];
    let iterations = 0;

    const doRequest = async (body) => {
      if (debug) debugLog.logRequest(body);
      const res = await openai.responses.create(body, { signal });
      if (debug) debugLog.logResponse(res);
      return res;
    };

    let response = await doRequest(createBody(chatLog));

    while (iterations < maxToolCalls) {
      if (signal.aborted) {
        throw new Error("Query aborted due to deadline exceeded");
      }

      if (response.output_text) {
        chatLog.push({ role: "assistant", content: response.output_text });
      }

      const toolCalls = response.output.filter(
        (item) => item.type === "function_call",
      );

      if (toolCalls.length === 0) {
        // No tool calls, we are done
        const finalResponse = response.output_text ?? "";
        if (responseSchema) {
          try {
            const parsed = responseSchema.parse(
              JSON.parse(finalResponse || "{}"),
            );
            return { finalResponse, parsed, chatLog };
          } catch (e) {
            return { finalResponse, parsed: null, chatLog };
          }
        }
        return { finalResponse, chatLog };
      }

      iterations++;

      for (const toolCall of toolCalls) {
        if (signal.aborted) {
          throw new Error("Query aborted due to deadline exceeded");
        }
        const toolName = toolCall.name;
        const tool = tools.find((t) => t.name === toolName);

        // Add tool call to chatLog as a separate item
        chatLog.push({
          type: "function_call",
          call_id: toolCall.call_id,
          name: toolName,
          arguments: toolCall.arguments,
        });

        let result;
        if (tool) {
          let args;
          try {
            args = JSON.parse(toolCall.arguments);
          } catch {
            result = "Error: Invalid JSON arguments";
          }

          if (!result) {
            try {
              if (process.env.DEBUG) {
                console.log(`Running tool ${toolName}...`);
              }
              result = await tool.handler(args, { cwd, signal });
              if (process.env.DEBUG) {
                console.log(result);
              }
            } catch (e) {
              result = `Error executing tool: ${e.message}`;
            }
          }
        } else {
          result = `Error: Tool ${toolName} not found`;
        }

        chatLog.push({
          type: "function_call_output",
          call_id: toolCall.call_id,
          output: String(result),
        });
      }

      response = await doRequest(createBody(chatLog));
    }

    return {
      finalResponse: "Error: Max tool calls reached without final answer.",
      ...(responseSchema ? { parsed: null } : {}),
      chatLog,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { query };
