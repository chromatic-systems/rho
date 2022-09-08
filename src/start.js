#!/usr/bin/env node
// INTERNAL DEPENDENCIES ========================
import Http from "./http.js";
import * as file from "../src/file.js";
import SymbolDB from "../src/symbol.js";

// EXTERNAL DEPENDENCIES ========================
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

const PORTSTRING = process.argv[2] || "8080";
const STORAGE_TYPE= process.argv[3] || "ram";
const MODE = process.argv[4] || "read";
const PUBKEY = process.argv[5] || "";
const PORT = parseInt(PORTSTRING);
const PUBLIC_PATH = join(__dirname, "../public");
const BASE_URL = `http://localhost:${PORT}`;

console.info(`MODE: ${MODE}`);
console.info(`PORT: ${PORT}`);

if (PUBKEY) console.log(`PUBKEY: ${PUBKEY}`);

// ========================================================
// START THE DATABASE
// ========================================================
const db = new SymbolDB({ mem: STORAGE_TYPE, mode: MODE, pubkey: PUBKEY})
await db.startDB();

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