import { watch } from "chokidar";
import { request } from "undici";
import { readFile } from "node:fs/promises";
import read from "fs-readdir-recursive";
import {log, logLevels as ll} from "../src/log.js";

// STATE
let BASE_URL;
let watcher;
let SPLIT_DIR;

async function watchHandler(event) {
  const filePath = event.toString();
  await putFile(filePath, SPLIT_DIR, BASE_URL);
}

async function putFile(filePath, splitDir, baseUrl) {
  const fileName = filePath.split(splitDir).pop();
  const extention = filePath.split(".").pop();
  // if the filename starts with a / remove it
  const key = fileName.startsWith("/") ? fileName.slice(1) : fileName;
  const value = await readFile(filePath);
  const type = mimeFromExt(extention);
  const keyUrl = `/k/${key}`
  const url = new URL(keyUrl, baseUrl);

  if (value.length === 0) return;
  const { statusCode } = await request(url, {
    method: "PUT",
    headers: { "content-type": type },
    body: value,
  });
  if (statusCode !== 200) {
    debugger
    throw new Error(`Error writing ${key} code ${statusCode}`);
  }
  return {statusCode, url: keyUrl, key};
}

async function putDir(path, splitDir, baseUrl) {
  const keys = []
  const files = read(path, () => true);
  for (const file of files) {
    const filePath = `${path}/${file}`;
    const {statusCode, url, key} = await putFile(filePath, splitDir, baseUrl);
    if (statusCode === 200) {
      keys.push(key)
    }
  }
  return keys;
}

async function watchAndLoad(path, splitDir, baseUrl) {
  SPLIT_DIR = splitDir;
  BASE_URL = baseUrl;
  // here we use chokidar to watch the public folder for changes
  async function startLoader(args) {
    watcher = watch(path, { depth: 2, atomic: true });
    watcher.on("change", watchHandler);
    watcher.on("add", watchHandler);
  }
  startLoader();
}

async function stop() {
  watcher.close();
}

const extentionMap = {
  html: "text/html",
  js: "text/javascript",
  css: "text/css",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpg",
  gif: "image/gif",
  wav: "audio/wav",
  mp4: "video/mp4",
  svg: "image/svg+xml",
  woff: "application/font-woff",
  ttf: "application/font-ttf",
  ico: "image/x-icon",
  txt: "text/plain",
  wasm: "application/wasm",
  "": "text/html",
};

function mimeFromExt(ext) {
  return extentionMap[ext];
}

// invert the extention map
const mimeMap = {};
for (const key in extentionMap) {
  if (key !== "") {
    const value = extentionMap[key];
    mimeMap[value] = key;
  }
}

export { watchAndLoad, stop, mimeFromExt, putDir };
