const { expect } = require("@playwright/test");
const { join } = require("node:path");

const screenshotPath = join(__dirname, "../screenshots", "test.png");

/**
 * @param {import("playwright").Page} page
 * @param {import("playwright").BrowserContext} context
 */
async function test(page, context) {
  await page.goto("http://localhost:8081/e/glicol");
  // select all text in the textarea and delete it
  await page.evaluate(() => {
    const textarea = document.querySelector("textarea");
    textarea.focus();
    textarea.select();
  }).catch(e => {console.log(e)});
  // press delete
  await page.keyboard.press("Delete");
  await page.type("textarea", message());
  await page.screenshot({ path: screenshotPath });
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