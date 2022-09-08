import { startHttp, stopHttp } from "../src/http.js";
import * as file from "../src/file.js";
// ========================================================
// TEST SUPPORT
// ========================================================
import { test, configure } from "brittle";
import { request } from "undici";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

// ========================================================
// STATE
// ========================================================
configure({ bail: true });
const PORT = 8081
const baseUrl = `http://localhost:${PORT}/`;
const publicPath = join(__dirname, "../public");
const testKey = randomUUID();

console.log("");
console.log("starting http server");
console.log("==============================================");

// ========================================================
// HTTP SERVER
// ========================================================
test("server starts", async (t) => {
  const { server, db } = await startHttp(PORT, "ram", "write");
  await file.watchAndLoad(publicPath, baseUrl);
  await sleep(1000);
  t.ok(db.feed.key);
  t.is(server.listening, true);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================================
// KEY STORE
// ========================================================
// Key 0 is the initial key all keys are derived from it
test("PUT key 0", async (t) => {
  const url = new URL(`/k/${testKey}`, baseUrl);
  const type = "text/plain";
  const value = "hello world";
  const { statusCode, headers, body } = await request(url, {
    method: "PUT",
    headers: { "content-type": type },
    body: value,
  });
  t.is(statusCode, 200);
});

test("GET key", async (t) => {
  const url = new URL(`/k/${testKey}`, baseUrl);
  const type = "text/plain";
  const value = "hello world";
  const { statusCode, headers, body } = await request(url);
  t.is(statusCode, 200);
  t.is(headers["content-type"], type);
  const content = await body.text();
  t.is(content, value);
});

test("LIST keys", async (t) => {
  const url = new URL(`/k`, baseUrl);
  const type = "application/json";
  const { statusCode, headers, body } = await request(url);
  t.is(statusCode, 200);
  t.is(headers["content-type"], type);

  const json = await body.json();
  t.is(json.length >0, true);
});

test("DELETE key", async (t) => {
  const url = new URL(`/k/${testKey}`, baseUrl);
  const { statusCode } = await request(url, {
    method: "DELETE",
  });
  t.is(statusCode, 200);
});

test("get index.html from http server", async (t) => {
  const { statusCode, headers, body } = await request(baseUrl);
  t.is(statusCode, 200);
  t.ok(headers)
  t.ok(body);

  const chunks = [];
  for await (const data of body) {
    chunks.push(data);
  }
  const text = Buffer.concat(chunks).toString();
  t.ok(text);
});

test("stop the server", async (t) => {
  const server = await stopHttp();
  await file.stop();
  t.is(server.listening === false, true);
});
