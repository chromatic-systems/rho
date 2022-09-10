// ===================================================
//                RELOAD ON SSE EVENT
// ===================================================
document.body.appendChild(document.createElement("p")).innerHTML = "RELOAD ON";
const evtSource = new EventSource("/sse");
evtSource.onmessage = function (event) {
  console.log("RELOADING", event.data);
  if (event.data === "reload") {
    window.location.reload();
  }
}
