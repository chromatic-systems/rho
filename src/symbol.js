// IMPORTS ================================================
import * as writer from "./writer.js";
import * as reader from "./reader.js";
// STATE ==================================================
const READING = "read";
const WRITING = "write";

class SymbolDB {
  constructor({mem, mode, pubkey}) {
    // verify pubkey is 64 bytes
    const length = pubkey?.length ?? 0;
    if(mode === READING && length !== 64) {
      throw new Error(`pubkey must be 64 bytes, got ${length}`);
    }
    this.mode = mode;
    this.mem = mem;
    this.pubkey = pubkey;
  }

  async startDB() {
    let dbs;
    if (this.mode === WRITING) {
       dbs = await writer.start(this.mem, "symbols");
    }
    if (this.mode === READING) {
      dbs = await reader.start(this.mem, this.pubkey);
    }

    this.db = dbs.db 
    this.metaDB = dbs.metaDB;
    this.dataDB = dbs.dataDB;
    return {pubkey : this.db.feed.key.toString("hex"), discoveryKey : this.db.feed.discoveryKey.toString("hex")}; 
  }


  async stopDB() {
    if (this.mode === WRITING) {
      await writer.stop();
    }
    if (this.mode === READING) {
      await reader.stop();
    }
  }

  async put(key, meta=emptyMeta(), value) {
    if (extentionMap[meta.type]) meta.type = extentionMap[meta.type];
    const metaJson = JSON.stringify(meta);
    await this.metaDB.put(key, metaJson);
    await this.dataDB.put(key, value);
  }

  async get(symbolKey) {
    const p1 = this.dataDB.get(symbolKey);
    const p2 = this.metaDB.get(symbolKey);
    const [node, metaNode] = await Promise.all([p1, p2]);
    if (!node) return empty(symbolKey);
    if (!metaNode) throw new Error(`No meta for ${symbolKey}`);
    const m = JSON.parse(metaNode.value);
    return { seq:node.seq, key: symbolKey, meta: m, value: node.value };
  }

  async  list(n) {
    const keys = [];
    for await (const { key } of this.dataDB.createReadStream()) {
      keys.push(key);
      if (n && keys.length >= n) break;
    }
    return keys;
  }
  
  async  del(key) {
    const p1 = this.dataDB.del(key);
    const p2 = this.metaDB.del(key);
    return Promise.all([p1, p2]);
  }
  
  stream() {
    return this.db.createHistoryStream({ live: true });
  }
}

// EXPORTS ================================================
export default SymbolDB

// HELPERS ================================================

function empty(key) {
  return { key, meta: emptyMeta(), value: undefined };
}

function emptyMeta() {
  return { type: "text/html", empty:true };
}


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