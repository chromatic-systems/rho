// IMPORT
import Corestore from "corestore";
import Hyperswarm from "hyperswarm";
import Hyperbee from "hyperbee";
import ram from "random-access-memory";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// STATE
let store;
let swarm;
let core;
let db;
const diskPath = join(__dirname, "../db-write");

// API
async function start(storage, dbName) {
  if (storage === "ram") {
    store = new Corestore(ram);
  } else {
    store = new Corestore(diskPath);
  }
  swarm = new Hyperswarm();

  // Setup corestore replication
  swarm.on("connection", (connection) => {
    // console.log("connection:", connection.publicKey.toString("hex"));
    store.replicate(connection);
  });

  core = store.get({ name: dbName });

  await core.ready();

  db = new Hyperbee(core, {
    keyEncoding: "utf-8",
    valueEncoding: "binary",
  });

  const metaDB = db.sub("meta", {
    valueEncoding: "utf-8",
  });

  const dataDB = db.sub("data", {
    valueEncoding: "binary",
  });

  swarm.join(db.feed.discoveryKey, { server: true, client: false });

  // Make sure we have all the connections
  await swarm.flush();
  // await db.put("/", Math.random().toString());

  return { db, metaDB, dataDB };
}

async function stop() {
  await db.close();
  await swarm.destroy();
  await core.close();
}

// EXPORT
export { start, stop };
