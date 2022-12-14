// INTERNAL LIBRARIES ===========================
import { log, logLevels as ll } from "../src/log.js";
import { test } from "../src/test.js";
import * as symbolTest from "./symbol.test.js";
import * as httpTest from "./http.test.js";
import watchBrowser from "../src/browser.js";
import * as file from "../src/file.js";
import Http from "../src/http.js";
import SymbolDB from "../src/symbol.js";

// EXTERNAL LIBRARIES ===========================
// @ts-ignore
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { watch } from "chokidar";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// STATE ========================================
const mainBrowser = new watchBrowser({ host: "http://localhost:8080", headless: true, slowMo: 10, devtools: false, height: 1000, width: 1000 });
const publicPath = join(__dirname, "../public");
const testWatchPath = join(publicPath, "test");
const execP = promisify(exec);
const screenshotSleepTime = 1;
start();

// TEST PLAN ====================================
async function start() {
  await killServer(8080);
  await killServer(8083);

  // TODO: Something in the symbolTest is conflicting with database startup
  // strange because we are using ram and stopping the previous test
  // for now we test independently
  // await symbolTest.start();
  // await httpTest.start();

  await test("create a read and write SymbolDB", writeSymbolDB);
  await test("start the read and write http server", startHTTP);
  await test("directory load via http put", putDir);
  await test("wait for key to be in the context DB", waitForKey);
  await test("watch directory and load on add or change", watchDir);
  await test("start a browser", startBrowser);
  await test("get the index page", getIndexPage);
  await test("get a 404 for empty key", get404Page);
  await test("edit an empty symbol and verify sse reload", editEmptySymbolSSE);
  await test("edit the globe template", editGlobe);
  // await test("edit a gemotric algebra symbol", editGeometricAlgebra);
  await test("stop the browser", stopBrowser);
  await test("stop the http server", stopHTTP);
  await test("spawn the app", spawnApplication);
  await test("start test watch", browserTestLoop);
  await test("stop the app", stopApplication);
}

// TESTS ========================================
async function writeSymbolDB({ ctx, log, expect }) {
  const writeDB = new SymbolDB({ mem: "ram", mode: "write", pubkey: null });
  const startResult = await writeDB.startDB();
  ctx.writeDB = writeDB;

  // const readDB = new SymbolDB({
  //   mem: "ram",
  //   mode: "read",
  //   pubkey: startResult.pubkey,
  // });
  // await readDB.startDB();
  // ctx.readDB = readDB;
}

// TESTS ========================================
async function startHTTP({ ctx, log, expect }) {
  const writeHttp = new Http({ port: 8080, db: ctx.writeDB });
  await writeHttp.start();
  ctx.writeHttp = writeHttp;

  // const readHttp = new Http({ port: 8081, db: ctx.readDB });
  // await readHttp.start();
  // ctx.readHttp = readHttp;
}

async function watchDir({ log, ctx, expect }) {
  await file.watchAndLoad(publicPath, "public", ctx.writeHttp.baseUrl);
  await file.stop();
}

async function putDir({ log, ctx, expect }) {
  const uploadedKeys = await file.putDir(
    publicPath,
    "public",
    ctx.writeHttp.baseUrl
  );
  ctx.uploadedKeys = uploadedKeys;
}

async function waitForKey({ log, ctx, expect }) {
  let result = { meta: { empty: true } };
  let key = ctx.uploadedKeys[0];
  while (result?.meta?.empty) {
    result = await ctx.writeDB.get(key);
    await sleep(100);
  }
}

// ========================================================
// BROWSER TESTS
// ========================================================
async function startBrowser({ ctx, log, expect }) {
  const { page, context, browser } = await mainBrowser.start();
  await page.evaluate(() => {
    console.error("browser logging attached");
  });

  ctx.page = page;
  ctx.context = context;
  ctx.browser = browser;
}

async function getIndexPage({ ctx, log, expect }) {
  const { page } = ctx;
  const result = await page.goto(`http://localhost:8080`);
  expect(result.status(), 200);
  const result2 = await page.goto(`http://localhost:8080/css/main.css`);
  expect(result2.status(), 200);
}

async function get404Page({ ctx, log, expect }) {
  const { page } = ctx;
  const randomKey = randomUUID();
  // playwright crashes if HEADLESS is false and it gets an empty 404
  const result = await page.goto(`http://localhost:8080/${randomKey}`);
  expect(result.status(), 404);
}

async function editEmptySymbolSSE({ log, ctx, expect }) {
  const { page, context } = ctx;
  const ssePage = await context.newPage();
  const randomKey = randomUUID();
  await ssePage.goto(`http://localhost:8080/${randomKey}`);

  const result = await page.goto(`http://localhost:8080/e/${randomKey}`);
  expect(result.status(), 200, "status code is 200");

  // focus on the editor
  const editor = await page.locator("#editor");
  await editor.focus();
  await editor.click();

  // type in the editor box
  await page.keyboard.type("<h2>hello world");
  await page.keyboard.down("Meta");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Meta");
  await page.keyboard.type(`<p>${randomKey}`);
  await screenshot(page, "test2");
  await clickSave(page);

  // expect the reader page to be updated via sse
  await screenshot(ssePage, "test");
  await ssePage.waitForSelector("h2");
  await ssePage.close();
}

async function editGeometricAlgebra({ ctx, log, expect }) {
  const page = await ctx.page;
  const uuid = randomUUID();

  await screenshot(page, "test");
}

async function editGlobe({ ctx, log, expect }) {
  const page = await ctx.page;
  const uuid = randomUUID();
  await page.goto(`http://localhost:8080/${uuid}`);
  await page.locator("#edit").click();
  await sleep(100);
  await page.keyboard.type("console.log('hello world')");
  await page.locator('select[name="template"]').selectOption("globe");
  await page.locator("#save").click();
  await page.goto(`http://localhost:8080/${uuid}`);
  await screenshot(page, "test");
  await page.setViewportSize({ width: 400, height: 800 });
  await page.reload();
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.reload();
  await screenshot(page, "testbig");
}

async function stopBrowser({ ctx, log, expect }) {
  await mainBrowser.stop();
}

async function stopHTTP({ ctx, log, expect }) {
  await ctx.writeHttp.stop();
  // await ctx.readHttp.stop();
}

function startChildApp(ctx, log, startPath) {
  let app = spawn(`node`, [startPath, "8083", "ram", "write", "local"]);


  const p = new Promise((resolve, reject) => {
    app.stdout.on("data", (data) => {
      const str = data.toString().trim();
      log(ll.info, "SPAWN:", str);

      const portRegex = /http:\/\/localhost:(\d+)/;
      if (portRegex.test(str)) {
        const port = str.match(portRegex)[1];
        ctx.app = app;
        ctx.port = port;
        resolve(app);
      }
    });
    app.stderr.on("data", (data) => {
      log(ll.alert, "SPAWN:", data.toString());
    });
  });

  app.on("close", (code) => {
    log(ll.info, "SPAWN:", `child process close all stdio with code ${code}`);
  });

  app.on("exit", (code) => {
    log(ll.info, "SPAWN:", `child process exited with code ${code}`);
  });

  return p;
}

// ========================================================
// START THE APP IN A SEPARATE PROCESS
// ========================================================
async function spawnApplication({ log, ctx, is }) {
  const startPath = join(__dirname, "../src/start.js");
  await startChildApp(ctx, log, startPath);

  // ========================================================
  // WATCH THE SRC DIRECTORY AND RELOAD ON CHANGE
  // ========================================================
  let watcher;
  let lastReload = Date.now();
  function startWatch(path) {
    console.log("watching", path);
    watcher = watch(path, { depth: 0, atomic: true });
    watcher.on("change", watchHandler);
    watcher.on("add", watchHandler);
  }

  async function watchHandler(event, fullPath) {
    try {
      if (Date.now() - lastReload < 500) {
        return;
      }
      const extention = event.toString().split(".").pop();
      const filePath = event.toString();
      const fileName = filePath.split("/").pop();
      log(ll.info, "HTTP RELOAD FROM:", fileName);
      await ctx.app.kill("SIGINT");
      await startChildApp(ctx, log, startPath);
      lastReload = Date.now();
    } catch (e) {
      console.error(e);
    }
  }

  ctx.spawnWatcher = watcher
  startWatch(join(__dirname, "../src"));
}

async function browserTestLoop({ log, ctx, expect }) {
  const watcher = new watchBrowser({ host: `http://localhost:${ctx.port}`, headless: false, slowMo: 10 });
  await watcher.start();
  watcher.watch(testWatchPath);
}

async function stopApplication({ ctx, log, expect }) {
  log(ll.info, "PORT:", ctx.port);
  await ctx.app.kill("SIGINT");
  process.exit(0);
}

// ========================================================
// HELPERS
// ========================================================
async function geometricAlgebra() {
  const script = `// Create a complex Algebra.
  Algebra(0,1,()=>{
  
  // Graph a two dimensional function to a canvas.
  // In this case we output the iterations it takes for z*z+c to converge to
  // infinity. (well, more than 2). 
    var canvas = this.graph((x,y)=>{
      var n=35, z=0e1, c=x*1.75-1+y*1e1;
      while (z < 2 && n--) z=z**2+c;
      return (n/30);
    });
  
  // Show the result
    document.getElementById("stage1").appendChild(canvas);
    
  });`;
  return script;
}
async function screenshot(page, name, ms = screenshotSleepTime) {
  const relativePath = `screenshots/${name}.png`;
  const absolutePath = join(__dirname, relativePath);
  await page.screenshot({ path: absolutePath });
  await sleep(ms);
}

async function fillInMessage(page, message) {
  await page.locator(`textarea[name='message']`).fill(message);
  // await page.type("textarea[name='message']", message);
}

async function clickSave(page) {
  await page.click("button[type='submit']");
}

async function clickMeta(page) {
  // get the elemet that have text meta
  await page.locator("text=meta").click();
}

async function clickNav(page) {
  // get the elemet that have text meta
  await page.locator("text=nav").click();
}

async function clickView(page) {
  // get the elemet that have text meta
  await page.locator("text=view").click();
}

async function tapSymbol(page, symbolKey) {
  let href = `/${symbolKey}`;
  if (symbolKey === "/") href = "/";
  await page.click(`a[href='${href}']`);
}

async function tapLink(page, href) {
  await page.click(`a[href='${href}']`);
}

async function killServer(port) {
  try {
    const cmd = `lsof -i:${port} | grep LISTEN | awk '{print $2}'`;
    const { stdout } = await execP(cmd);
    const pid = stdout.trim();
    await execP(`kill -9 ${pid}`);
    log(ll.alert, "KILLED:", pid);
  } catch (error) {
    log(ll.info, "KILL:", "PORT OPEN");
  }
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
