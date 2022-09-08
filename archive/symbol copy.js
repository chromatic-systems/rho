import Corestore from "corestore";
import Hyperswarm from "hyperswarm";
import Hyperbee from "hyperbee";
import ram from "random-access-memory";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// STATE ==================================================
const READING = "read";
const WRITING = "write";
const RAM = "ram";
const DISK = "disk";

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

class SymbolDB {
  constructor({ mem, mode, pubkey }) {
    // verify pubkey is 64 bytes
    const length = pubkey?.length ?? 0;
    if (mode === READING && length !== 64) {
      throw new Error(`pubKey must be 64 bytes, got ${length}`);
    }
    if (mode !== READING && mode !== WRITING) {
      throw new Error(`mode must be 'read' or 'write', got ${mode}`);
    }
    if (mem !== RAM && mem !== DISK) {
      throw new Error(`mem must be 'ram' or 'disk', got ${mem}`);
    }

    if (mem === RAM) {
      this.store = new Corestore(ram);
    }
    if (mem === DISK) {
      this.diskPath = join(__dirname, `../db-${mode}`);
      this.store = new Corestore(this.diskPath);
    }

    const dbName = "symbols";
    if (mode === WRITING) {
      this.core = this.store.get({ name: dbName });
    }
    if (mode === READING) {
      console.log("pubkey:", pubkey);
      this.core = this.store.get(Buffer.from(pubkey, "hex"));
    }

    this.swarm = new Hyperswarm();
    this.mode = mode;
    this.mem = mem;
    this.pubKey = pubkey;
    this.core = this.store.get({ name: dbName });
  }

  async startDB() {
    // Make sure we have the latest length

    this.swarm.on("connection", (connection) => {
      console.log("connection:", connection.publicKey.toString("hex"));
      this.store.replicate(connection);
    });
    
    await this.core.ready();

    this.db = new Hyperbee(this.core, {
      keyEncoding: "utf-8",
      valueEncoding: "binary",
    });
    
    this.metaDB = this.db.sub("meta", {
      valueEncoding: "utf-8",
    });
    
    this.dataDB = this.db.sub("data", {
      valueEncoding: "binary",
    });

    if (this.mode === WRITING) {
      console.log(this.db.feed.discoveryKey.toString("hex"));
      this.swarm.join(this.db.feed.discoveryKey,  { server: true, client: false });
    }
    
    if (this.mode === READING) {
      console.log(this.db.feed.discoveryKey.toString("hex"));
      this.swarm.join(this.db.feed.discoveryKey,  { server: false, client: true });
    }

    // Make sure we have all the connections
    await this.swarm.flush();

    return {
      pubkey: this.db.feed.key.toString("hex"),
      discoveryKey: this.db.feed.discoveryKey.toString("hex"),
    };
  }

  async stopDB() {
    await this.db.close();
    await this.swarm.destroy();
    await this.core.close();
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
}

export default SymbolDB;


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

// EXPORTS ================================================
