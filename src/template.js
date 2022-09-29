// @ts-ignore
import { html, renderToString } from "@popeindustries/lit-html-server";

// ========================================================
// WHOLE PAGE EXAMPLES
// ========================================================
async function article(symbol) {
  const styles = html`<style></style>`;
  const postScripts = reloaderScript();
  const mainElement = html`${symbol.value}`;
  const headers = "";
  const head = headHtml(symbol.key, headers);
  const body = html`<article>
    <main class="center">${mainElement}</main>
  </article>`;
  const nav = headsUpDisplay(symbol, "view");
  return baseHtml(symbol.key, head, styles, body, postScripts, nav);
}

async function nav(symbol) {
  const { key, meta, value } = symbol;
  const styles = "";
  const postScripts = "";
  const headers = "";
  const head = headHtml(key, headers);
  const body = navBody({ key, meta });
  const nav = headsUpDisplay(symbol, "view");
  return baseHtml(symbol.key, head, styles, body, postScripts, nav);
}

async function editor(symbol) {
  const { key, meta, value } = symbol;
  const styles = html`<style>
    /* if body is >800px wide change flex direction to row */
    @media (min-width: 800px) {
      body {
        flex-direction: row;
      }
      nav {
        width: 50%;
        left: 0;
      }
    }
    </style>`;
  const postScripts = "";
  const headers = "";
  const head = headHtml(key, headers);
  const body = editorBody({ key, meta, value });
  const nav = headsUpDisplay(symbol, "edit");
  return baseHtml(symbol.key, head, styles, body, postScripts, nav);
}

function headsUpDisplay(symbol, mode) {
  let navElement = html``;
  if (mode === "view") {
    navElement = html`<nav>
      <a id="home" href="/">Home</a>
      <a id="edit" href="/e/${symbol.key}">Edit</a>
      <a id="nav" href="/n/${symbol.key}">Nav</a>
    </nav>`;
  } else if (mode === "edit") {
    navElement = html`<nav>
      <a id="view" href="/${symbol.key}">View</a>
      <a id="nav" href="/n/${symbol.key}">Nav</a>
      <button id="save" class="round" tabindex="1" type="submit">Save</button>
    </nav>`;
  }
  return navElement;
}

async function geometric_algebra(symbol) {
  const styles = "";
  const postScripts = gaScript(symbol);
  const mainElement = html`<div id="stage1"></div>`;
  const footerElement = html`<p id="data1"></p>`;
  const headers = html`<script src="https://unpkg.com/ganja.js"></script>`;
  const head = headHtml(symbol.key, headers);
  const body = html`<article><main>${mainElement}</main></article>${footerElement}`;
  const nav = headsUpDisplay(symbol, "view");
  return baseHtml(symbol.key, head, styles, body, postScripts, nav);
}

function gaScript(symbol) {
  const script = html`<script>
    ${symbol.value.toString()};
  </script>`;
  return script;
}

async function globe(symbol) {
  const styles = html` <style>
    #globeViz {
      position: relative;
      flex: 1;
      box-sizing: border-box;
    }
  </style>`;
  const postScripts = html`${globeScript(symbol.value)} ${reloaderScript()}`;
  const headers = html`<script
    type="module"
    src="/apps/globe3/globe.bun.js"
  ></script>`;
  const head = headHtml(symbol.key, headers);
  const mainElement = html`<div id="globeViz"></div>`;
  const body = html`<article><main>${mainElement}</main></article>`;
  const nav = headsUpDisplay(symbol, "view");
  return baseHtml(symbol.key, head, styles, body, postScripts, nav);
}

async function _404(key) {
  const headers = "";
  const head = headHtml(key, headers);
  const styles = "";
  const postScripts = reloaderScript();
  const mainElement = html`<p>404: ${key}</p>`;
  const body = html`<article>
    <main>${mainElement}</main>
  </article>`;
  const nav = headsUpDisplay({ key }, "view");
  return baseHtml(key, head, styles, body, postScripts, nav);
}

async function metaDataHtml(symbol) {
  const styles = "";
  const postScripts = reloaderScript();
  const headers = "";
  const head = headHtml(symbol.key, headers);
  const mainElement = html`<pre><code>${JSON.stringify(
    symbol.meta,
    null,
    2
  )}</code></pre>`;
  const body = html`<article>
    <main>${mainElement}</main>
  </article> `;
  const nav = headsUpDisplay(symbol, "view");
  return baseHtml(symbol.key, head, styles, body, postScripts, nav);
}

function emptyHtml(symbol) {
  return symbol.value.toString();
}

function globeMain() {
  return html` <div id="globeViz"></div> `;
}

function globeScript(code) {
  return html` <script>
    ${code};
  </script>`;
}

function reloaderScript() {
  return html` <script>
    document.body.appendChild(document.createElement("p")).innerHTML =
      "RELOAD ON";
    const evtSource = new EventSource("/sse");
    evtSource.onmessage = function (event) {
      console.log("RELOADING", event.data);
      if (event.data === "reload") {
        window.location.reload();
      }
    };
  </script>`;
}

{
  /* <script type="module">
import flamethrower from "/k/js/flame.js";
flamethrower({ log: true, pageTransitions: true });
</script>  */
}

function headHtml(title, headers) {
  return html`<meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="/k/favicon.ico" />
    <link rel="stylesheet" href="/base.css" />
    ${headers}
    <title>${title}</title>`;
}

async function baseHtml(key, head, styles, body, postScripts, nav) {
  const finalHtml = html`<!DOCTYPE html>
    <html lang="en">
      <head>
        ${head} ${styles}
      </head>
      <body>
        ${nav} ${body}
      </body>
      ${postScripts}
      <!-- <script type="module" src="/webcom/nav-bar/nav-bar.js"></script> -->
      <script type="module" src="/webcom/edit/edit.bun.js"></script>
    </html>`;

  const markup = await renderToString(finalHtml);
  return markup;
}

// <!-- <nav-bar render:client data-key="${key}"></nav-bar> -->
// ========================================================
// HTML ELEMENTS EXAMPLES
// ========================================================
function imageNode(key, title) {
  const style = `style="max-height: 600px;"`;
  return `<img ${style} src="/k/${key}" alt="${title}" />`;
}

function navBody({ key, meta }) {
  return html`<article>
    <h2>Nav</h2>
    <main>
      <p>${key}</p>
      <p>${JSON.stringify(meta, null, 2)}</p>
    </main>
  </article>`;
}

function editorBody({ key, meta, value }) {
  return html`<article>
    <div class="row">
      <p>Template:</p>
      <select id="template-selector" tabindex="0" name="template">
        <option value="article">article</option>
        <option id="globe-option" value="globe">globe</option>
        <option value="emptyHtml">emptyHtml</option>
        <option value="text">text</option>
        <option value="javascript">javascript</option>
        <option value="geometric_algebra">geometric_algebra</option>
      </select>
    </div>
    <input tabindex="2" type="text" name="type" value="${meta.type}" />
      <main>
        <edit-code
          render:client
          tabindex="1"
          id="editor"
          data-key="${key}"
          data-title="${key}"
          data-save-button-id="save"
          data-template-selector-id="template-selector"
        >
        </edit-code>
      </main>
    </article>
    <article>
      <main>
        <iframe id="preview" src="/${key}"></iframe>
      </main>
    </article>`;
}

// ========================================================
// SVG EXAMPLES
// ========================================================
function circles(n) {
  let svgString = `<svg width="300" height="300">`;
  for (let i = 0; i < n; i++) {
    const p1 = (Math.random() * 300).toFixed(2);
    const p2 = (Math.random() * 300).toFixed(2);
    const p3 = (Math.random() * 300).toFixed(2);
    const hsl = randomHsl();
    svgString += `<circle cx="${p1}" cy="${p2}" r="${p3}" stroke="${hsl}" stroke
    stroke-width="2" fill="transparent" />`;
  }
  `</svg>`;
  return svgString;
}

function curves(n) {
  let svgString = `<svg width="300" height="300">`;
  for (let i = 0; i < n; i++) {
    const p1 = (Math.random() * 300).toFixed(2);
    const p2 = (Math.random() * 300).toFixed(2);
    const p3 = (Math.random() * 300).toFixed(2);
    svgString += `<path d="M0,0 C${p1},0 ${p2},300 ${p3},300" stroke="${randomHsl()}" stroke-width="2" fill="transparent" />`;
  }
  `</svg>`;
  return svgString;
}

// ========================================================
// CSS EXAMPLES
// ========================================================
function randomHsl() {
  const h = (Math.random() * 360).toFixed(0);
  const s = (Math.random() * 100).toFixed(0);
  const l = (Math.random() * 100).toFixed(0);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

async function baseCss() {
  const css = html`<style>
    *:where(:not(iframe, canvas, img, svg, video):not(svg *, symbol *)) {
      all: unset;
      display: revert;
    }
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    ol,
    ul,
    menu {
      list-style: none;
    }
    img {
      max-width: 100%;
    }
    table {
      border-collapse: collapse;
    }
    textarea {
      white-space: revert;
    }
    :where([hidden]) {
      display: none;
    }
    :where([contenteditable]) {
      -moz-user-modify: read-write;
      -webkit-user-modify: read-write;
      overflow-wrap: break-word;
      -webkit-line-break: after-white-space;
    }
    :where([draggable="true"]) {
      -webkit-user-drag: element;
    }
    select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;

      background-color: transparent;
      border: none;
      padding: 0;
      padding-top: 1px;
      margin: 0;
      width: 100%;
      font-family: inherit;
      font-size: inherit;
      cursor: inherit;
      line-height: inherit;
      z-index: 1;
      outline: none;
    }

    /* color vars */
    :root {
      --color-aware: #408fea;
      --color-focus: #f69902;
      --color-alert: #ff4800;
      --color-text: #ddd;
      --color-subtext: #bbb;
      --color-border: #ddd;
      --color-shadow: #444;
      --color-background: #000;
      --gradient: linear-gradient(0deg, #dab58e, #e04829, #ffffff);
      --gradient-green: linear-gradient(45deg, #00711a, #d3eb00);
      --gradient-blue: linear-gradient(45deg, #81bbf8, #0178a4);
      --gradient-orange: linear-gradient(45deg, #ff6a00, #ffcc00);
    }

    iframe {
      flex: 1;
      box-sizing: border-box;
      border: 0;
    }

    .blue-glow {
      background: var(--gradient-blue);
      animation: pulse 4s ease-in-out infinite;
      background-size: 100% 200%;
      background-position-y: 100%;
    }

    .orange-glow {
      background: var(--gradient-orange);
      animation: pulse 4s ease-in-out infinite;
      background-size: 100% 200%;
      background-position-y: 100%;
    }

    .purple-glow {
      background-image: var(--gradient);
      animation: pulse 4s ease-in-out infinite;
      background-size: 100% 200%;
      background-position-y: 100%;
    }

    .green-glow {
      background-image: var(--gradient-green);
      animation: pulse 4s ease-in-out infinite;
      background-size: 100% 200%;
      background-position-y: 100%;
    }

    .green {
      /* color: var(--color-focus); */
      background-image: var(--gradient-green);
    }

    .blue {
      /* color: var(--color-aware); */
      background-image: var(--gradient-blue);
    }

    .orange {
      /* color: var(--color-alert); */
      background-image: var(--gradient-orange);
    }

    b {
      font-weight: 900;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      background-size: 100% 200%;
      background-position-y: 100%;
      border-radius: 0.4rem;
      animation: pulse 4s ease-in-out infinite;
    }

    html {
      height: fill-available;
      height: -webkit-fill-available;
    }

    body {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      color: var(--color-text);
      background-color: var(--color-background);
      box-sizing: border-box;
      min-height: 100vh;
      min-height: fill-available;
      min-height: -webkit-fill-available;
      display: flex;
      flex-direction: column;
      padding: 0;
      margin: 0;
      align-items: center;
      margin-bottom: 50px;
    }

    article {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 15px;
      gap: 15px;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    footer {
      flex: 0;
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 15px;
    }

    header {
      flex: 0;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    h1 {
      font-size: 2em;
    }

    h2 {
      font-size: 1.5em;
    }

    img {
      max-height: 60%;
      width: auto;
      max-width: 360px;
    }

    .row {
      display: flex;
      flex-direction: row;
      justify-content: center;
      box-sizing: border-box;
      gap: 15px;
    }

    p {
      line-height: 1.4em;
      color: var(--color-subtext);
    }

    a {
      cursor: pointer;
      padding-left: 20px;
      padding-right: 20px;
      padding-top: 10px;
      padding-bottom: 10px;
      border-radius: 0px;
      text-align: center;
      font-size: 1.3em;
      outline: var(--color-border) solid 1px;
    }

    .round {
      outline : none;
      border-radius: 25px;
    }

    a:hover {
      background-color: var(--color-focus);
      color: var(--color-background);
    }

    a:focus {
      background-color: var(--color-focus);
      color: var(--color-background);
      outline: 2px solid white;
    }

    button {
      cursor: pointer;
      padding-left: 20px;
      padding-right: 20px;
      padding-top: 10px;
      padding-bottom: 10px;
      border-radius: 0px;
      text-align: center;
      font-size: 1.3em;
      background: var(--gradient-orange);
      animation: pulse 4s ease-in-out infinite;
      background-size: 100% 200%;
      background-position-y: 100%;
      color: black;
      /* transition 1 sec */
    }

    button:hover {
      background: var(--gradient-blue);
    }

    button:focus {
      background: var(--gradient-green);
      outline: 3px solid var(--color-border);
    }

    textarea {
      flex: 1;
      padding: 15px;
      border: 1px solid var(--color-border);
    }

    textarea:focus {
      border: 1px solid var(--color-focus);
    }

    input {
      padding: 15px;
      border: 1px solid var(--color-border);
    }

    input:focus {
      border: 1px solid var(--color-focus);
    }

    form {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1em;
    }

    nav {
      /* the nav should be fixed to the bottom of the page */
      display: flex;
      position: fixed;
      align-items: center;
      align-content: center;
      justify-content: center;
      justify-items: center;
      gap: 15px;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100px;
      z-index: 100;
    }

    #stage {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
    }

    .center {
      align-items: center;
      justify-content: center;
    }

    .text-gradient {
      font-weight: 900;
      background-image: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      background-size: 100% 200%;
      background-position-y: 100%;
      border-radius: 0.4rem;
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        background-position-y: 0%;
      }
      50% {
        background-position-y: 80%;
      }
    }
  </style>`;

  let string = await renderToString(css);
  // remove <style> tags
  string = string.replace(/<style>|<\/style>/g, "");
  return string;
}

export {
  nav,
  baseCss,
  baseHtml,
  metaDataHtml,
  article,
  _404,
  globe,
  emptyHtml,
  editor,
  geometric_algebra,
};
