// ========================================================
// WHOLE PAGE EXAMPLES
// ========================================================
function article(symbol) {
  const css = "";
  const script = reloader()
  const mainElements = symbol.value.toString();
  // const links = [`<a href="/">Home</a>`];
  const links = [];
  const body = mainArticleFooter(mainElements, links);
  return baseHtml(symbol.key, body, script, css);
}

function reloader() {
  return `
  document.body.appendChild(document.createElement("p")).innerHTML = "RELOAD ON";
  const evtSource = new EventSource("/sse");
  evtSource.onmessage = function (event) {
  console.log("RELOADING", event.data);
  if (event.data === "reload") {
    window.location.reload();
  }
  }`;
}

function _404(key) {
  const css = "";
  const script = reloader()
  const body = mainArticleFooter("404", [
  ]);
  return baseHtml("404", body, script, css);
}

function metaDataHtml(key, meta) {
  const preCode = `<pre>${JSON.stringify(meta, null, 2)}</pre>`;
  const editLink = `<a href="/e/${key}">edit</a>`;
  const keyLink = `<a href="/${key}">view</a>`;
  const navLink = `<a href="/n/${key}">nav</a>`;
  const body = mainArticleFooter(preCode, [editLink, keyLink, navLink]);
  const css = baseCss();
  const script = "";
  const html = baseHtml("Meta", body, script, css);
  return html;
}

{
  /* <script type="module">
import flamethrower from "/k/js/flame.js";
flamethrower({ log: true, pageTransitions: true });
</script>  */
}
function baseHtml(title, body, script, style) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="/k/favicon.ico" />
    <link rel="stylesheet" href="/base.css" />
    <title>${title}</title>
    <style>
      ${style}
    </style>
  </head>
  <body>
    <nav-bar data-key="chromascope"></nav-bar>
    ${body}
    <script>
    ${script}
    </script>
  </body>
  <script type="module" src="/webcom/nav-bar/nav-bar.js"></script>
  <script type="module" src="/webcom/edit/edit.bun.js"></script>
</html>
`;
}

// ========================================================
// HTML ELEMENTS EXAMPLES
// ========================================================
function imageNode(key, title) {
  const style = `style="max-height: 600px;"`;
  return `<img ${style} src="/k/${key}" alt="${title}" />`;
}

function mainArticleFooter(mainElements, links) {
  const top = (mainElements, footerElements) => {
    return `<article>
    <main class="center">${mainElements}</main>
    ${footerElements}
    </article>`;
  };
  const footer = (element) => {
    return `<footer>${element}</footer>`;
  };
  const linksHtml = links
    .map((link) => {
      return link;
    })
    .join("");

  return top(mainElements, footer(linksHtml));
}

function listSymbolsBody(keys) {
  let body = `<article>
  <h1>Keys</h1>`;
  keys.forEach((key) => {
    body += `<a class="button-gradient" href="/${key}">${key}</a>`;
  });
  body += `</article>`;
  return body;
}

function navBody({ key, meta }) {
  const growStyle = `style="flex-grow: 1;"`;

  return `<article>
    <h2>Nav</h2>
    <main>
    <p>${key}</p>
    <p>${JSON.stringify(meta, null, 2)}</p>
    </main>
    <footer>
    <a href="/m/${key}">meta</a>
    <a href="/${key}">view</a>
    <a ${growStyle} href="/e/${key}">edit</a>
    </footer>
  </article>`;
}

function editorBody({ key, meta, value }) {
  // button should flex grow
  const buttonStyle = `max-width: 200px; width: 200px;`;
  return `
  <form action="/k" method="post">
  <article>
  <select tabindex="0" name="template">
  <option value="article">article</option>
  <option value="text/html">html</option>
  <option value="text/plain">text</option>
  <option value="text/javascript">javascript</option>
  </select>
  <textarea id="message" tabindex="1" name="message" placeholder="message">${value}</textarea>
  <input tabindex="2" type="text" name="type" value="${meta.type}" />
  <footer>
  <button ${buttonStyle} id="save" tabindex="3" type="submit">Save</button>
  <a href="/m/${key}">Meta</a>
  <a href="/${key}">View</a>
  </footer>
  </article>
  <article>
  <input tabindex="4" type="hidden" name="key" value="${key}" />
  <a href="/n/${key}">Nav</a>
  </article>
  </form>`;
}

function editorBody2({ key, meta, value }) {
  // button should flex grow
  const buttonStyle = `width: 300px;`;
  return `
  <article>
  <button ${buttonStyle} id="save" tabindex="3" type="submit">Save</button>
  <div class="row">
  <p>Template:</p>
  <select tabindex="0" name="template">
  <option value="article">article</option>
  <option value="text/html">html</option>
  <option value="text/plain">text</option>
  <option value="text/javascript">javascript</option>
  </select>
  </div>
    <main>
      <edit-code
      tabindex="1"
      id="editor"
      data-key="${key}"
      data-title="${key}"
      data-save-button-id="save"
      ></edit-code>
    </main>
  </article>
  <article>
  <input tabindex="2" type="text" name="type" value="${meta.type}" />
  <a href="/m/${key}">Meta</a>
  <a href="/${key}">View</a>
  <input tabindex="4" type="hidden" name="key" value="${key}" />
  <a href="/n/${key}">Nav</a>
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

function baseCss() {
  return `*:where(:not(iframe, canvas, img, svg, video):not(svg *, symbol *)) {
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
  // styles reset, including removing the default dropdown arrow
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

  // Stack above custom arrow
  z-index: 1;

  // Remove focus outline, will add on alternate element
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
  flex:1;
  display: flex;
  flex-direction: column;
}

footer {
  flex:0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 15px;
}

header {
  flex:0;
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
  padding: 20px;
  border-radius: 0px;
  text-align: center;
  font-size: 1.3em;
  /* transition 1 sec */
  transition: all 1s;
  outline: var(--color-border) solid 1px;
  background-image: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 100% 200%;
  background-position-y: 100%;
  animation: pulse 4s ease-in-out infinite;
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
  padding: 20px;
  background-color: var(--color-alert);
  border-radius: 30px;
  text-align: center;
  font-size: 1.3em;
  /* transition 1 sec */
  transition: all 1s;
}

button:hover {
  background-color: var(--color-focus);
  color: var(--color-background);
}

button:focus {
  background-color: var(--color-focus);
  color: var(--color-background);
  outline: 3px solid var(--color-border);
}

textarea {
  flex:1;
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
  flex:1;
  display: flex;
  flex-direction: column;
  gap: 1em;
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
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    background-position-y: 0%;
  }
  50% {
    background-position-y: 80%;
  }
}`;
}

export {
  navBody,
  editorBody,
  listSymbolsBody,
  baseCss,
  baseHtml,
  metaDataHtml,
  mainArticleFooter,
  curves,
  imageNode,
  randomHsl,
  article,
  circles,
  _404,
  editorBody2
};
