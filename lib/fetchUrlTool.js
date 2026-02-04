const { z } = require("zod");

const fetchUrlSchema = z.object({
  type: z.literal("fetchUrl"),
  url: z.string().describe("URL to fetch (e.g. https://...)."),
});
fetchUrlSchema.type = "fetchUrl";

const fetchUrlTool = {
  name: "fetchUrl",
  description:
    "Fetch a URL with GET and return the response body as UTF-8 text.",
  schema: fetchUrlSchema,
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
fetchUrlTool.type = "fetchUrl";

module.exports = { fetchUrlTool };
