// INTERNAL DEPEENDENCIES
import { idGenerator } from "../src/http.js";
import * as watchBrowser from "../src/browser.js";
import * as template from "../src/template.js";

// EXTERNAL DEPENDENCIES
import chalk from "chalk";
import { chromium, webkit } from "playwright";
import { devices, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { test, configure } from "brittle";
configure({ bail: true });


function getSha1(buffer) {
  const hash = createHash("sha1");
  hash.update(buffer);
  return hash.digest("hex");
}

const execP = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8081;
const BASE_URL = `http://localhost:${PORT}`;
const START_PATH = join(__dirname, "../src/start.js");
const PUBLIC_PATH = join(__dirname, "../public");
const SCREENSHOT_SLEEP = 1; //ms
// const BROWSER_TYPE = "webkit";
const BROWSER_TYPE = "chromium";
const HEADLESS = false;

// STATE
let browser;
let context;
let page;

// TESTS
test("create an ID", async (t) => {
  const id = await idGenerator();
  expect(id).toBeDefined();
  t.pass();
});

test("server starts", async (t) => {
  await killServer(PORT);
  const childServer = spawn(`node`, [START_PATH,  PORT.toString(), "ram","write"]);

  const p = new Promise((resolve, reject) => {
    childServer.stdout.on("data", (data) => {
      const str = data.toString().trim();
      console.log(chalk.green(str));
      resolve(str);
    });

    childServer.stderr.on("data", (data) => {
      console.error(chalk.red(data.toString()));
      reject(data.toString());
    });
  });
  await p;
  await sleep(1000);
  t.pass();
});

test("start the browser and attach diagnostics", async (t) => {
  // @ts-ignore
  if (BROWSER_TYPE === "webkit") {
    browser = await webkit.launch({
      headless: HEADLESS
      // slowMo: 200,
      // devtools: true,
    });
  } else if (BROWSER_TYPE === "chromium") {
    browser = await chromium.launch({
      headless: HEADLESS,
      // slowMo: 5,
      // devtools: true,
    });
  }

  const settings = {
    viewport: { width: 400, height: 800 },
    deviceScaleFactor: 2,
  };
  context = await browser.newContext({
    // ...iPhone,
    ...settings,
  });
  page = await context.newPage();

  // @ts-ignore
  // const browserLogsStream = createWriteStream(BROWSER_LOG_PATH);
  page.on("console", (message) => {
    if (message.type() === "error") {
      // browserLogsStream.write(chalk.bgRedBright("ERROR: "+message.text()) + "\n");
      console.error(chalk.bgRedBright("BROWSER: " + message.text()));
    }
    console.log(chalk.blue(message.text()));
  });

  await page.evaluate(() => {
    console.error("diagnostics attached");
  });

  t.pass();
});

test("index page", async (t) => {
  const response = await page.goto(BASE_URL);
  expect(response.status()).toBe(200);

  // @ts-ignore
  if (BROWSER_TYPE === "chromium") {
    const cookies = await context.cookies([BASE_URL]);
    const idCookie = cookies.find((cookie) => cookie.name === "id");
    expect(idCookie.secure).toBe(true);
    expect(idCookie.sameSite).toBe("Lax");
  }

  const color = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue(
      "--color-background"
    );
  });
  expect(color).toBe(getBackgroundColor());
  t.pass();
});

test("create pages", async (t) => {
  const response = await page.goto(BASE_URL);
  const symbols = [
    {},
    {
      main:"<h1>hello</h1><a href='/0'>zero</a>",
      title: "hello",
      template: "article",
    },
    {
      main: template.imageNode("images/solarbot.png", "Solarbot"),
      title: "Solarbot",
      template: "article",
    },
    {
      main: template.imageNode("images/bluecity.png", "Blue City"),
      title: "Blue City",
    },
    {
      main: template.imageNode("images/mosswave.png", "Moss Wave"),
      title: "Moss Wave",
    },
    {
      main: template.imageNode("images/vinevillage.png", "Vine Village"),
      title: "Vine Village",
    },
    {
      main: template.curves(10),
      title: "Curves 10",
    },
    {
      main: template.circles(5),
      title: "Circles 5",
    },
  ];
  const keys = ["/", "/", "0", "1", "2", "3", "4"];
  for (let i = 1; i < keys.length - 1; i++) {
    // create the message
    const currentKey = keys[i];
    const prevLink = keys[i - 1];
    const nextLink = keys[i + 1];
    const title = symbols[i].title;
    const links = makeLinksHtml(prevLink, currentKey, nextLink);
    const main = symbols[i].main;
    const message = slideTemplate1(currentKey, title, main, links);
    const messageHash = await getSha1(message);
    await fillInMessage(message);
    await screenshot(page, "test");
    await clickSave();

    await screenshot(page, "test");
    await page.goto(`${BASE_URL}/e/${currentKey}`);

    // verify the message has the same hash after getting it back
    const editMessage = await page.evaluate(() => {
      const editMessage = document.querySelector("#message").textContent;
      return editMessage;
    });
    const editMessageHash = await getSha1(editMessage);
    expect(editMessageHash).toBe(messageHash);

    await clickSave();
    await clickNav();
    await clickView();
    await tapSymbol(nextLink);
  }
  await page.goto(BASE_URL);
  t.pass();
});

test("create pages", async (t) => {
  const path = join(__dirname, "pages");
  await watchBrowser.startWatch(path, page, context);
  await watchBrowser.stop();
  t.pass();
})

test("stop the browser", async (t) => {
  await browser.close();
  t.pass();
});

test("stop the server", async (t) => {
  await killServer(PORT);
  await sleep(1000);
  t.pass();
});

// ========================================================
// HELPERS
// ========================================================


async function fillInMessage(message) {
  await page.locator(`textarea[name='message']`).fill(message);
  // await page.type("textarea[name='message']", message);
}

async function clickSave() {
  await page.click("button[type='submit']");
}

async function clickMeta() {
  // get the elemet that have text meta
  await page.locator("text=meta").click();
}

async function clickNav() {
  // get the elemet that have text meta
  await page.locator("text=nav").click();
}

async function clickView() {
  // get the elemet that have text meta
  await page.locator("text=view").click();
}

async function tapSymbol(symbolKey) {
  let href = `/${symbolKey}`;
  if (symbolKey === "/") href = "/";
  await page.click(`a[href='${href}']`);
}
async function tapLink(href) {
  await page.click(`a[href='${href}']`);
}

async function killServer(port) {
  try {
    const cmd = `lsof -i:${port} | grep LISTEN | awk '{print $2}'`;
    const { stdout } = await execP(cmd);
    const pid = stdout.trim();
    await execP(`kill -9 ${pid}`);
    console.log(`killed server ${pid} on port ${port}`);
  } catch (error) {
    console.log("PORT OPEN");
  }
}

async function screenshot(page, name) {
  const relativePath = `screenshots/${name}.png`;
  const absolutePath = join(__dirname, relativePath);
  await page.screenshot({ path: absolutePath });
  await sleep(SCREENSHOT_SLEEP);
}

function getBackgroundColor() {
  // @ts-ignore
  if (BROWSER_TYPE === "webkit") {
    return "#000";
  } else if (BROWSER_TYPE === "chromium") {
    return " #000";
  }
}

function makeLinksHtml(prev, curr, next) {
  // flex and direction is row gap 15px
  const { prevLink, nextLink } = makeLinks(prev, next);
  // join with newline and return string
  if (curr === "/") curr = "";
  const navLink = `<a href="/n/${curr}">nav</a>`;
  return `
  <div>
  ${prevLink}
  ${navLink}
  ${nextLink}
  </div>`;
}

function makeLinks(prevKey, nextkey) {
  // unicode for the left arrow
  let prevLink = `<a href="/${prevKey}">Back</a>`;
  if (prevKey === "/") {
    prevLink = `<a href="/">Back</a>`;
  }
  let nextLink = `<a href="/${nextkey}">Next</a>`;
  if (nextkey === "/") {
    nextLink = `<a href="/">Next</a>`;
  }
  return { prevLink, nextLink };
}

function slideTemplate1(key, title, main, links) {
  return `<h1>${title}</h1>
    ${main}
    <p>${key}</p>
    ${links}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
