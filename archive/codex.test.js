import { listModels, code } from "../src/codex.js";
import { test, configure } from "brittle";
configure({ bail: true });

const model = "ada-code-search-code";

test("listModels()", async (t) => {
  const result = await listModels();
  const modelExists = result.data.find((item) => {
    if (item.id === model) {
      return item;
    }
    return false;
  });
  t.ok(modelExists);
});

test("code()", async (t) => {
  const prompt = `// a function that adds two numbers
  function add`;
  const result = await code(model, prompt);
  t.ok(result.choices[0].text);
});

// get two results with temperature up to create variation
test("code() with 2 results, temperature 0.5 stop on }", async (t) => {
  const prompt = `// multiply two matrices
  function matrix`;
  const result = await code(model, prompt, 2, 64, 0.5, ["}"]);
  t.not(result.choices[0].text, result.choices[1].text);
});