import Http from "../src/http.js";
import {test} from "../src/test.js";
import { request } from "undici";
import { randomUUID } from "node:crypto";
import SymbolDB from "../src/symbol.js";
import {log, logLevels as ll} from "../src/log.js";

const testKey = randomUUID();

async function start() {
  await test("startHTTP", startHTTP);
  await test("use the api", useApi);
  await test("stopHTTP", stopHTTP);
}

async function startHTTP({ctx,log,expect}) {
  const db = new SymbolDB({ mem: "ram", mode: "write", pubkey: null });
  await db.startDB();
  const http = new Http({port:8080, db});
  await http.start();
  ctx.http = http;
}

async function useApi({ctx,log,expect}) {
  const baseUrl = ctx.http.baseUrl;
  const type = "text/plain";
  const value = "hello world";
  const url = `${baseUrl}/k/${testKey}`;
  // log(ll.info, "USEAPI", `url: ${url}`);
  await request(url, {
    method: "PUT",
    headers: { "content-type": type },
    body: value,
  });

  const { body } = await request(`${baseUrl}/k/${testKey}`);
  const data = await body.text();
  expect(data, "hello world");
}

async function stopHTTP({ctx,log,expect}) {
  await ctx.http.stop();
}

export {start};