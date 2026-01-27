/**
 * The code in this file is only for debugging.
 */

const DEBUG_MAX = 120;

function trunc(s) {
  if (s == null) return s;
  const t = String(s);
  return t.length <= DEBUG_MAX ? t : t.slice(0, DEBUG_MAX) + "...";
}

function summaryRequest(body) {
  const tools = (body.tools || []).map((t) => ({ name: t.name }));
  const input = (body.input || []).map((item) => {
    if (item.role && item.content != null) {
      return { role: item.role, content: trunc(item.content) };
    }
    if (item.type === "function_call") {
      return {
        type: item.type,
        name: item.name,
        arguments: trunc(item.arguments),
      };
    }
    if (item.type === "function_call_output") {
      return { type: item.type, call_id: item.call_id, output: trunc(item.output) };
    }
    return item;
  });
  return JSON.stringify(
    { model: body.model, input, tools, text: body.text ? "<format>" : undefined },
    null,
    2,
  );
}

function summaryResponse(res) {
  const output = (res.output || []).map((item) => {
    if (item.type === "function_call") {
      return { type: item.type, name: item.name, arguments: trunc(item.arguments) };
    }
    if (item.type === "function_call_output") {
      return { type: item.type, call_id: item.call_id, output: trunc(item.output) };
    }
    return item;
  });
  return JSON.stringify(
    {
      output_text: trunc(res.output_text),
      output,
      id: res.id,
    },
    null,
    2,
  );
}

function logRequest(body) {
  console.error("[query] --- request ---");
  console.error(summaryRequest(body));
}

function logResponse(res) {
  console.error("[query] --- response ---");
  console.error(summaryResponse(res));
}

module.exports = { logRequest, logResponse };
