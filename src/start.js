#!/usr/bin/env node
// INTERNAL DEPENDENCIES ========================
import Http from "./http.js";
import * as file from "../src/file.js";
import SymbolDB from "../src/symbol.js";
import {log, logLevels as ll} from "../src/log.js";

// EXTERNAL DEPENDENCIES ========================
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

const PORTSTRING = process.argv[2] || "8080";
const STORAGE_TYPE= process.argv[3] || "ram";
const MODE = process.argv[4] || "read";
const SWARM = process.argv[5] || "local";
const PUBKEY = process.argv[6] || "";
const PORT = parseInt(PORTSTRING);
const PUBLIC_PATH = join(__dirname, "../public");
const BASE_URL = `http://localhost:${PORT}`;

log(ll.info ,"START:", `MODE: ${MODE}`);
log(ll.info, "START:", `PORT: ${PORT}`);

if (PUBKEY) console.log(`PUBKEY: ${PUBKEY}`);

// ========================================================
// START THE DATABASE
// ========================================================
// if SWARM is a string, parse it to a boolean else use the default
const db = new SymbolDB({ mem: STORAGE_TYPE, mode: MODE, pubkey: PUBKEY, swarm: SWARM });
const {pubkey} = await db.startDB();
log(ll.info, "START:", `PUBLIC KEY: ${pubkey}`);

// ========================================================
// START THE HTTP SERVER
// ========================================================
const http = new Http({port:PORT, db});
await http.start();

// ========================================================
// WATCH THE PUBLIC DIRECTORY AND LOAD ON ADD OR CHANGE
// ========================================================
if(MODE === "write") {
  await file.watchAndLoad(PUBLIC_PATH, "public", BASE_URL);
}