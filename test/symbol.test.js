import SymbolDB from "../src/symbol.js";
import { test } from "../src/test.js";
export { start };

async function start() {
  await test("create a SymbolDB in both modes", createTwoSymbolNodes);
  await test("write and read from different SymbolDBs", writeAndRead);
  await test("list the symbols", list);
  await test("delete a symbol", deleteSymbol);
  await test("stop the SymbolDB", stopDB);
}

async function createTwoSymbolNodes({ log, ctx, expect }) {
  ctx.testKey = "test";
  const writeDB = new SymbolDB({ mem: "ram", mode: "write", pubkey: null });
  const result = await writeDB.startDB();
  expect(writeDB.mode, "write", "mode is write");
  expect(writeDB.mem, "ram", "mem is ram");
  expect(writeDB.pubkey, undefined, "pubKey is undefined");

  const readDB = new SymbolDB({
    mem: "ram",
    mode: "read",
    pubkey: result.pubkey,
  });
  await readDB.startDB();
  expect(readDB.mode, "read", "mode is read");
  expect(readDB.mem, "ram", "mem is ram");
  expect(readDB.pubkey, result.pubkey, "pubKey is passed");

  ctx.writeDB = writeDB;
  ctx.readDB = readDB;
}

async function list({ log, ctx, expect }) {
  const db = ctx.writeDB;
  const result = await db.list();
  expect(result.length, 1, "list has one item");
}

async function writeAndRead({ log, ctx, expect }) {
  await ctx.writeDB.put("test", {}, "test");
  const result = await ctx.writeDB.get("test");
  expect(result.value.toString(), "test", "value is test");
  // TODO: wait for replication
  await sleep(500);
  const readResult = await ctx.readDB.get("test");
  expect(readResult.value.toString(), "test", "value is test");
}

async function deleteSymbol({ log, ctx, expect }) {
  const db = ctx.writeDB;
  await db.del(ctx.testKey);
  const result = await db.get(ctx.testKey);
  expect(result.value, undefined, "value is undefined");
  // list should be 0
  const listResult = await db.list();
  expect(listResult.length, 0, "list is empty");
}

async function stopDB({ log, ctx, expect }) {
  await ctx.writeDB.stopDB();
  await ctx.readDB.stopDB();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
