const fetchUrlTool = {
  type: "function",
  name: "fetchUrl",
  description:
    "Fetch a URL with GET and return the response body as UTF-8 text.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "URL to fetch (e.g. https://...).",
      },
    },
    required: ["url"],
    additionalProperties: false,
  },
  handler: async ({ url }, { signal } = {}) => {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        return `Error: ${res.status} ${res.statusText}`;
      }
      return await res.text();
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};

module.exports = { fetchUrlTool };
