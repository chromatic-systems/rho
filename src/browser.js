import { log, logLevels as ll } from "../src/log.js";

// EXTERNAL DEPENDENCIES
import { chromium, webkit } from "playwright";
import { createRequire } from "node:module";
import { watch } from "chokidar";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);

class Browser {
  constructor({ host, headless, slowMo = 0, devtools = false, height = 800, width = 400, browserType = "chromium" }) {
    this.browser = null;
    this.context = null;
    this.browserType = browserType;
    this.height = height;
    this.width = width;
    this.mainPage = null;
    this.watcher = null;
    this.running = false;
    this.waitingForUpdate = [];
    this.sha1TestedIndex = {};
    this.headless = headless;
    this.slowMo = slowMo;
    this.devtools = devtools;
    this.host = host;
  }

  async start() {
    // @ts-ignore
    const launchOptions = {
      headless: this.headless,
      slowMo: this.slowMo,
      devtools: this.devtools,
    };

    if (this.browserType === "webkit") {
      this.browser = await webkit.launch(launchOptions);
    } else if (this.browserType === "chromium") {
      this.browser = await chromium.launch(launchOptions);
    }

    const settings = {
      viewport: { width: this.width, height: this.height },
      deviceScaleFactor: 2,
    };
    this.context = await this.browser.newContext({
      ...settings,
    });
    this.mainPage = await this.context.newPage();
    this.mainPage.on("console", (message) => {
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

    // Use this to see all requests made by the page
    this.mainPage.route("**", (route) => {
      // console.log(route.request().url());
      route.continue();
    });

    // Use this evaluate javascript in the page
    // await mainPage.evaluate(() => {
    //   console.info("browser logging attached");
    // });

    return {
      page: this.mainPage,
      context: this.context,
      browser: this.browser,
    };
  }

  watch(path) {

    this.watcher = watch(path, { depth: 0, atomic: true });
    this.watcher.on("change", this.watchHandler.bind(this));
    this.watcher.on("add", this.watchHandler.bind(this));
  }

  async stop() {
    await this.watcher?.close();
    await this.context?.close();
    await this.browser.close();
  }

  async watchHandler(event) {
    try {
      const extention = event.toString().split(".").pop();
      const filePath = event.toString();
      if (extention === "cjs") {
        const fileName = filePath.split("/").pop();
        this.waitingForUpdate.push(filePath);
        log(ll.info, "WATCH:", fileName);
        this.runTest();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async runTest() {
    if (this.running) {
      return;
    }
    try {
      this.running = true;
      while (this.waitingForUpdate.length > 0) {
        const filePath = this.waitingForUpdate.shift();
        const fileName = filePath.split("/").pop();

        // check if file has been tested before
        const sha1 =  await sha1ofFile(filePath);
        if (this.sha1TestedIndex[filePath] === sha1) {
          return
        }

        log(ll.info, `TESTING:`, fileName);
        delete require.cache[require.resolve(filePath)];
        const { test } = require(filePath);
        await test({browserContext: this.context, page: this.mainPage, host:this.host});

        // add file to tested index
        this.sha1TestedIndex[filePath] = sha1;
      }
    } catch (e) {
      console.error("ERROR running Test");
      console.error(e.toString());
    } finally {
      this.running = false;
    }
  }
}

async function sha1ofFile(filePath) {
  const hash = createHash("sha1");
  const file = await readFile(filePath);
  hash.update(file);
  return hash.digest("hex");
}

export default Browser;
