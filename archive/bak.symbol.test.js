import * as sym from "../src/symbol.js";

// ========================================================
// TEST SUPPORT
// ========================================================
import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import chalk from "chalk";

// ========================================================
// STATE
// ========================================================
const testKey = randomUUID();
configure({ bail: true });

// ========================================================
// KEY STORE
// ========================================================
test("startSymbolSwarm()", async (t) => {
  const points = await sym.startDB("ram", "write")
  t.pass()
});

test("delete all keys", async (t) => {
  const keys = await sym.list();
  for (const key of keys) {
    await sym.del(key);
  }
  const keys2 = await sym.list();
  expect(keys2.length).toBe(0);
  t.pass();
});

test("putSymbol()", async (t) => {
  const type = "text/plain";
  const value = "hello world";
  // @ts-ignore
  await sym.put(testKey, {type}, value);
});

test("get()", async (t) => {
  const type = "text/plain";
  const value = "hello world";
  const result = await sym.get(testKey);
  expect(result.meta.type).toBe(type);
  expect(result.value.toString()).toBe(value);
});

test("list()", async (t) => {
  const result = await sym.list();
  expect(result.length).toBe(1);
});

test("del()", async (t) => {
  const result = await sym.del(testKey);
  // verify key is gone
  const result2 = await sym.get(testKey);
  t.alike(result2, sym.empty(testKey));
});

test("stopDB()", async (t) => {
  await sym.stopDB();
});

function log(...args) {
  console.log(chalk.bgYellowBright("TEST:"), ...args);
}
