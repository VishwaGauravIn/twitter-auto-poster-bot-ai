const assert = require("node:assert/strict");
const test = require("node:test");
const { generateTweet } = require("../index");

test("generates content with the supported Gemini model", async () => {
  let request;
  const ai = {
    models: {
      generateContent: async (input) => {
        request = input;
        return { text: "A generated tweet" };
      },
    },
  };

  const text = await generateTweet(ai);

  assert.equal(text, "A generated tweet");
  assert.equal(request.model, "gemini-3.6-flash");
  assert.equal(request.config.maxOutputTokens, 400);
  assert.match(request.contents, /under 280 characters/);
});
