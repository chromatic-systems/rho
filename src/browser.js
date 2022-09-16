import { watch } from "chokidar";
import { createRequire } from "node:module";
import { chromium, webkit } from "playwright";
import { log, logLevels as ll } from "../src/log.js";

const require = createRequire(import.meta.url);

// STATE
let watcher;
let running = false;
let mainPage = null;
let browserContext = null;
const browserType = "chromium";
const needs_update = [];

async function startBrowser({ headless, slowMo=0 }) {
  let browser;
  // @ts-ignore
  if (browserType === "webkit") {
    browser = await webkit.launch({
      headless,
      slowMo
      // devtools: true,
    });
  } else if (browserType === "chromium") {
    browser = await chromium.launch({
      headless,
      slowMo,
      devtools: true,
    });
  }

  const settings = {
    viewport: { width: 400, height: 800 },
    deviceScaleFactor: 2,
  };
  browserContext = await browser.newContext({
    ...settings,
  });
  mainPage = await browserContext.newPage();
  mainPage.on("console", (message) => {
    if (message.type() === "error") {
      // if message has 404, ignore it
      if (message.text().includes("404")) {
        return;
      }
      log(ll.alert, "PAGE:", message.text());
    } else {
      log(ll.info, "PAGE:", message.text());
    }
  });

  // await mainPage.evaluate(() => {
  //   console.info("browser logging attached");
  // });

  return { page: mainPage, context: browserContext, browser };
}

async function startWatch(path) {
  watcher = watch(path, { depth: 0, atomic: true });
  watcher.on("change", watchHandler);
  watcher.on("add", addWatchHandler);
}

async function stop() {
  await watcher.close();
}

async function watchHandler(event, fullPath) {
  try {
    const extention = event.toString().split(".").pop();
    const filePath = event.toString();
    if (extention === "cjs") {
      const fileName = filePath.split("/").pop();
      needs_update.push(filePath);
      log(ll.info, "WATCH:", fileName);
      runTest();
    }
  } catch (e) {
    console.error(e);
  }
}

async function addWatchHandler(event, fullPath) {
  try {
    const extention = event.toString().split(".").pop();
    const filePath = event.toString();
    if (extention === "cjs") {
      const fileName = filePath.split("/").pop();
      needs_update.push(filePath);
      log(ll.info, "ADDED:", fileName);
    }
  } catch (e) {
    console.error(e);
  }
}

async function runTest() {
  if (running) {
    return;
  }
  try {
    running = true;
    // load and unload the test modules
    while (needs_update.length > 0) {
      const filePath = needs_update.pop();
      const fileName = filePath.split("/").pop();
      log(ll.info, `TESTING:`, fileName);
      delete require.cache[require.resolve(filePath)];
      const { test } = require(filePath);
      await test(mainPage, browserContext);
    }
    running = false;
  } catch (e) {
    console.error("ERROR running Test");
    console.error(e.toString());
    running = false;
  }
}

export { startWatch, stop, startBrowser };
