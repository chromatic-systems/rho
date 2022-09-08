// IMPORTS ================================================
import Hyperbee from "hyperbee";
import Hyperswarm from "hyperswarm";
import Hypercore from "hypercore";
import { once } from "node:events";
import ram from "random-access-memory";

// STATE ==================================================

let core;
let db;
let metaDB
let dataDB
// let iconDB
// let accessDB

const swarm = new Hyperswarm();

// TYPES ==================================================

function emptyNode(key) {
  return { key, meta: { type: "text/html", empty:true }, value: undefined };
}


// STARTUP ================================================
async function stopSymbolSwarm() {
  await db.close();
  await swarm.destroy();
  await core.close();
}

async function ensureIsReadable(core) {
  const key = core.key.toString("hex");
  if (core.writable || core.peers.length) {
    // console.log(`CORE ${key}`);
    // console.log(`DISCOVERY KEY: ${core.discoveryKey.toString("hex")}`);
  } else {
    console.log(`Waiting for peers to connect for core ${key}`);
    const [peer] = await once(core, "peer-add");

    const peerKey = peer.remotePublicKey.toString("hex");
    console.log(`Connected to ${peerKey} for core ${key}`);
  }
}

async function startSymbolSwarm() {
  core = new Hypercore(ram);
  db = new Hyperbee(core);

  await db.feed.ready();
  await ensureIsReadable(core);
  swarm.join(db.feed.discoveryKey);
  return db;
}

// API ====================================================
async function putSymbol(key, meta={type:"text/html"}, value) {
  if(core.writable === false) return
  if (extentionMap[meta.type]) meta.type = extentionMap[meta.type];
  const metaJson = JSON.stringify(meta);
  await metaDB.put(key, metaJson);
  await dataDB.put(key, value);
}

async function getSymbol(queryKey) {
  const p1 = dataDB.get(queryKey);
  const p2 = metaDB.get(queryKey);
  const [node, metaNode] = await Promise.all([p1, p2]);
  if (!node) return emptyNode(queryKey);
  if (!metaNode) throw new Error(`No meta for ${queryKey}`);
  const m = JSON.parse(metaNode.value);
  return { seq:node.seq, key: queryKey, meta: m, value: node.value };
}

async function listSymbols(n) {
  const keys = [];
  for await (const { key } of dataDB.createReadStream()) {
    keys.push(key);
    if (n && keys.length >= n) break;
  }
  return keys;
}

async function deleteSymbol(key) {
  const p1 = dataDB.del(key);
  const p2 = metaDB.del(key);
  return Promise.all([p1, p2]);
}

function symbolStream() {
  return db.createHistoryStream({ live: true });
}

// EXPORTS ================================================
export {
  stopSymbolSwarm,
  putSymbol,
  getSymbol,
  listSymbols,
  deleteSymbol,
  startSymbolSwarm,
  symbolStream,
  emptyNode,
};

// HELPERS ================================================
const extentionMap = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  "": "text/html",
};

// invert the extention map
const mimeMap = {};
for (const key in extentionMap) {
  if (key !== "") {
    const value = extentionMap[key];
    mimeMap[value] = key;
  }
}
