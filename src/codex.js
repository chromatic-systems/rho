import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  organization: "org-JxXMP6AMndVV0C6ELQKUrOnS",
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function listModels() {
  const response = await openai.listModels();
  return response.data;
}

async function code(
  model = "ada-code-search-code",
  prompt,
  n = 1,
  max_tokens = 64,
  temperature = 0.1,
  stop = undefined
) {
  const response = await openai.createCompletion({
    model,
    prompt,
    temperature,
    max_tokens,
    stop,
    n,
  });
  return response.data;
}
export { listModels, code };
