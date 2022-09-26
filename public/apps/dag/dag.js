import cytoscape from "cytoscape";
import cytoscapeDagre from "cytoscape-dagre";
cytoscape.use(cytoscapeDagre);
import cytoscapeAvsdf from "cytoscape-avsdf";
cytoscape.use(cytoscapeAvsdf);


// --color-aware: #408fea;
// --color-focus: #f69902;
// --color-alert: #ff4800;
// --color-text: #ddd;
// --color-subtext: #bbb;
// --color-border: #ddd;
// --color-shadow: #444;
// --color-background: black;
// --gradient: linear-gradient(0deg, #dab58e, #e04829);

function setTitle(data) {
  document.getElementById("data").innerHTML = data;
}
function getPrimaryColor() {
  return getComputedStyle(document.documentElement).getPropertyValue(
    "--color-text"
  );
}
function getLineColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--line");
}
function getFocusColor() {
  return getComputedStyle(document.documentElement).getPropertyValue(
    "--color-focus"
  );
}
function getBackgroundColor() {
  return getComputedStyle(document.documentElement).getPropertyValue(
    "--color-background"
  );
}
function getAlertColor() {
  return getComputedStyle(document.documentElement).getPropertyValue(
    "--color-alert"
  );
}
function node(ctx, id) {
  ctx.add({
    group: "nodes",
    data: { id, weight: 75 },
    position: { x: 200, y: 200 },
  });
}
function edge(ctx, id, source, target) {
  ctx.add({
    group: "edges",
    data: { id, source, target },
  });
}
function randIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var cy = cytoscape({
  container: document.getElementById("stage"), // container to render in
  style: [
    // the stylesheet for the graph
    {
      selector: "node",
      style: {
        "background-color": "#1e1e1e",
        color: getPrimaryColor(),
        label: "data(id)",
        "text-wrap": "wrap",
        "text-halign": "center",
        "text-valign": "center",
      },
    },

    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": "#333",
        "target-arrow-color": "#ccc",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      },
    },
  ],
});

// loop over letters A-Z
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
for (var i = 0; i < letters.length; i++) {
  var letter = letters[i];
  node(cy, letter);
}

let count = 30;
let k = setInterval(() => {
  const firstIdx = randIntBetween(0, letters.length - 1);
  var first = letters[firstIdx];
  var second = letters[randIntBetween(firstIdx, letters.length - 1)];
  if (first != second) {
    const e = cy.edges(`[id = "${first + second}"]`);
    if (e.length == 0) {
      edge(cy, first + second, first, second);
    }
  }

  cy.layout({ name: "concentric", animate: true }).run();
  count--;
  if (count == 0) {
    clearInterval(k);
  }
}, 1000);
