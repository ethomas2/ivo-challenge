const OpenAI = require("openai");

const openai = new OpenAI();

// Query a LLM and run any tool calls it invokes. Returns {finalResponse, chatLog}
async function query(
  systemPrompt,
  {
    model = "gpt-5",
    tools = [],
    maxToolCalls = 10,
    cwd = process.cwd(),
    deadlineSecs = 60,
  } = {}
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

    const chatLog = [{ role: "user", content: systemPrompt }];
    let iterations = 0;

    let response = await openai.responses.create(
      {
        model,
        input: chatLog,
        tools: apiTools,
      },
      { signal }
    );

    while (iterations < maxToolCalls) {
      if (signal.aborted) {
        throw new Error("Query aborted due to deadline exceeded");
      }

      if (response.output_text) {
        chatLog.push({ role: "assistant", content: response.output_text });
      }

      const toolCalls = response.output.filter(
        (item) => item.type === "function_call"
      );

      if (toolCalls.length === 0) {
        // No tool calls, we are done
        return {
          finalResponse: response.output_text,
          chatLog,
        };
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

      response = await openai.responses.create(
        {
          model,
          input: chatLog,
          tools: apiTools,
        },
        { signal }
      );
    }

    return {
      finalResponse: "Error: Max tool calls reached without final answer.",
      chatLog,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { query };
