// IMPORTS ================================================
import * as writer from "../src/writer.js";
import * as reader from "../src/reader.js";
// STATE ==================================================
const READING = "read";
const WRITING = "write";
let MODE = READING

let db;
let metaDB
let dataDB
// let iconDB
// let lockDB

// TYPES ==================================================
function empty(key) {
  return { key, meta: emptyMeta(), value: undefined };
}

/**
 * Returns an empty meta object.
 * @returns {{type: string, empty: boolean}}
 */
function emptyMeta() {
  return { type: "text/html", empty:true };
}


// STARTUP ================================================
async function startDB(storage, mode, pubKey) {
  MODE = mode;
  // core = new Hypercore(dataPath ?? ram);
  if(mode === WRITING) {
   ({db, metaDB, dataDB} = await writer.start(storage, "symbols"));
  }
  
  if(mode === READING) {
    ({db, metaDB, dataDB} = await reader.start(storage, pubKey))
  }

  if(mode !== READING && mode !== WRITING) {
    throw new Error(`Must be in ${READING} or ${WRITING} mode`);
  }

  return db;
}

async function stopDB() {
  if(MODE === WRITING) {
    await writer.stop()
   }
   
   if(MODE === READING) {
     await reader.stop()
   }
 
   if(MODE !== READING && MODE !== WRITING) {
     throw new Error(`Must be in ${READING} or ${WRITING} mode`);
   }
}

// API ====================================================
async function put(key, meta=emptyMeta(), value) {
  if (extentionMap[meta.type]) meta.type = extentionMap[meta.type];
  const metaJson = JSON.stringify(meta);
  await metaDB.put(key, metaJson);
  await dataDB.put(key, value);
}

async function get(symbolKey) {
  const p1 = dataDB.get(symbolKey);
  const p2 = metaDB.get(symbolKey);
  const [node, metaNode] = await Promise.all([p1, p2]);
  if (!node) return empty(symbolKey);
  if (!metaNode) throw new Error(`No meta for ${symbolKey}`);
  const m = JSON.parse(metaNode.value);
  return { seq:node.seq, key: symbolKey, meta: m, value: node.value };
}

async function list(n) {
  const keys = [];
  for await (const { key } of dataDB.createReadStream()) {
    keys.push(key);
    if (n && keys.length >= n) break;
  }
  return keys;
}

async function del(key) {
  const p1 = dataDB.del(key);
  const p2 = metaDB.del(key);
  return Promise.all([p1, p2]);
}

function stream() {
  return db.createHistoryStream({ live: true });
}

// EXPORTS ================================================
export {
  stopDB,
  put,
  get,
  list,
  del,
  startDB,
  stream,
  empty,
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
