const { expect } = require("@playwright/test");
const { join } = require("node:path");


const screenshotPath = join(__dirname, "../screenshots", "test.png");

/**
 * @param {import("playwright").BrowserContext} ctx
 * @param {import("playwright").Page} page
 */
async function test(ctx, page) {
  await page.goto("http://localhost:8083/e/glicol");
  const editor = await page.locator("#editor");
  await clearAndFocus(page);
  await page.keyboard.type("<h2>hello world hi");
  await page.click("#save");
  await page.hover("#nav");
}

async function clearAndFocus(page) {
  const editor = await page.locator("#editor");
  await editor.focus();
  await editor.click();
  await page.keyboard.down("Meta");
  await page.keyboard.press("A");
  await page.keyboard.up("Meta");
  await page.keyboard.press("Backspace");
}

function message() {
  const js = `
  <article>
  <h1>Hello World</h1>
  <main>
  </main>
  <footer>
  <a href="/">Home</a>
    <button id="play">Play</button>
  </footer>
</article>
<script type="module" src="/k/audio/audio.bun.js"></script>
  `
  return js;
}

module.exports = { test };


// <script type="module">
// import Glicol from "./js/glicol.js"
// const glicol = new Glicol()
// // get the play element
// const play = document.querySelector("#play")
// // add a click listener to the play element
// play.addEventListener("click", () => {
//   glicol.play({
//     "o": sin(440).mul("~am"),
//     "~am": sin(0.2).mul(0.3).add(0.5)
//   })
// })
// </script>