// INTERNAL LIBRARIES ===============================
import * as sym from "./symbol.js";
import {
  baseHtml,
  baseCss,
  listSymbolsBody,
  editorBody,
  metaDataHtml,
  navBody,
  article,
} from "./template.js";

// EXTERNAL LIBRARIES ===========================
import http from "node:http";
import busboy from "busboy";
import { randomUUID, createHash } from "node:crypto";


// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

// STATE ========================================
let server;
let db;

// TODO: load these from a symbol, for now use a module
const renderTemplates = { article };

// TODO: hook up the etag UI configuation per symbol
const etagCache = {};

// ERROR HANDLING ===================
process.on("unhandledRejection", (error) => {
  log("unhandledRejection", error);
  // throw error;
});

process.on("uncaughtException", (error) => {
  log("uncaughtException", error);
  // throw error;
});

// REQUEST HANDLER ==============================
const allowedMethods = ["HEAD", "CONNECT", "GET", "POST", "PUT", "DELETE"];
async function handleRequest(req, res) {
  // console.log(req.method, req.url);
  if (!allowedMethods.includes(req.method)) {
    methodNotAllowed(req, res);
    return;
  }

  // if the url is misformed with double //
  if (req.url.includes("//")) {
    res.writeHead(301, { Location: req.url.replace(/\/\//g, "/") });
    res.end();
    return;
  }

  // TODO: more robust routing, preferably strict
  // res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  // res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  const cookies = req.headers.cookie;
  if (cookies) {
    // no need to set
  }

  // This is the simplest cookie, a uudid set to HTTPOnly
  // theoretically this hides the value, need more understanding
  if (!cookies) {
    const id = randomUUID();
    const secure_cookie = makeCookie(id);
    res.setHeader("Set-Cookie", secure_cookie);
  }

  // not used other than a test, pages could listen via
  // 1.) a websocket
  // 2.) a long poll
  // 3.) a server sent event
  {
    const { matched } = urlMatch(req, "/api/symbolStream");
    if (matched) {
      const stream = sym.stream();
      res.writeHead(200, { "Content-Type": "text/plain" });
      for await (const { key, value } of stream) {
        res.write(`${key}:${value}`);
      }
      res.end();
      return;
    }
  }

  // ==========================================
  // MAIN ROUTING
  // ==========================================

  // NAVIGATION /n/:key
  {
    const { matched, groups } = urlMatch(req, "/n/:key");
    if (matched) {
      await handleNav(req, res, groups);
      return;
    }
  }

  // NAVIGATION /n
  {
    const { matched, groups } = urlMatch(req, "/n");
    if (matched) {
      await handleNav(req, res, { key: "index.html" });
      return;
    }
  }

  // META /m/:key
  {
    const { matched, groups } = urlMatch(req, "/m/:key");
    if (matched) {
      await handleMeta(req, res, groups);
      return;
    }
  }

  // EDITOR /e
  {
    const { matched, groups } = urlMatch(req, "/e");
    if (matched) {
      await handleEdit(req, res, { key: "index.html" });
      return;
    }
  }

  // EDITOR /e/:key
  {
    const { matched, groups } = urlMatch(req, "/e/:key");
    if (matched) {
      await handleEdit(req, res, groups);
      return;
    }
  }

  // KEY INDEX /k
  {
    const { matched } = urlMatch(req, "/k");
    if (matched && req.method === "POST") {
      await handleSymbolPost(req, res);
      return;
    }

    if (matched && req.method === "GET") {
      const result = await sym.list();
      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify(result));
      return;
    }
  }

  // KEY /k/:key
  {
    const { matched, groups } = urlMatch(req, "/k/:key*");
    if (matched && req.method === "PUT") {
      await handleSymbolPut(req, res, groups);
      return;
    }

    if (matched && req.method === "DELETE") {
      await handleSymbolDelete(req, res, groups);
      return;
    }

    if (matched && req.method === "GET") {
      await handleSymbolGet(req, res, groups);
      return;
    }
  }
  let file = req.url;

  // INDEX
  if (file === "/") {
    file = "index.html";
  }
  // the key is the file
  {
    // remove the leading / if it exists
    const key = file.replace(/^\//, "");
    const result = await handleTemplateGet(req, res, { key });
    if (result) return;
  }

  // NOTHING HERE GO TO EDITOR
  res.writeHead(302, {
    Location: `/e/${file}`,
  });
  res.end();
}

// HANDLERS =====================================
async function handleNav(req, res, navGroups) {
  const { key } = navGroups;
  const node = await sym.get(key);
  if (node) {
    // a simple html page as a string with the key in it
    const body = navBody(node);
    const css = baseCss();
    const html = baseHtml(node.key, body, [], css);
    const headers = { "Content-Type": node.meta.type };
    res.writeHead(200, headers);
    res.end(html);
  } else {
    // no node at that key
    res.writeHead(404);
    res.end();
  }
}

async function handleMeta(req, res, groups) {
  const { key } = groups;
  const nodeAtKey = await sym.get(key);
  const { meta, value } = nodeAtKey;
  const mime = "text/html";
  const html = metaDataHtml(key, meta);
  res.writeHead(200, { "Content-Type": mime });
  res.end(html);
}

async function handleSymbolDelete(req, res, groups) {
  const { key } = groups;
  await sym.del(key);
  res.writeHead(200);
  res.end();
}

async function handleTemplateGet(req, res, groups) {
  const { key } = groups;
  const symbol = await sym.get(key);
  const { meta, value } = symbol;

  // NOTHING HERE GO TO EDITOR
  if (meta.empty) {
    res.writeHead(302, {
      Location: `/e/${key}`,
    });
    res.end();
    return true;
  }

  // SHA1 VERIFICATION
  if (
    meta.type === "text/html" &&
    meta.etag !== getSha1(value.toString("utf8"))
  ) {
    throw new Error(`sha1 mismatch for ${key}`);
  }

  if (meta.etag) {
    // TODO: research Cache-Control and ETag headers
    // only seting for icon images for now
    if (meta.type === "image/x-icon") {
      res.setHeader(
        "Cache-Control",
        "max-age=10000, stale-while-revalidate=10000"
      );
    }
    res.setHeader("ETag", meta.etag);
  }

  if (meta.type !== "text/html") {
    res.writeHead(200, {
      "Content-Type": meta.type,
    });
    res.end(value);
    return true;
  }

  if (meta.template == null) {
    res.writeHead(200, {
      "Content-Type": meta.type,
    });
    res.end(value);
    return true;
  }

  let template = renderTemplates[meta.template];

  // Get the template if it is not in the cache
  if (template == null) {
    // TODO: load templates from symbol store
    // template = await sym.get(meta.template);
    res.writeHead(200, {
      "Content-Type": meta.type,
    });
    res.end(value);
    return true;
  }
  const html = template(symbol);
  res.writeHead(200, {
    "Content-Type": meta.type,
  });
  res.end(html);
  return true;

  // TODO: load the template from the symbol store
  // const symbolValue = template.value.toString("utf8");
  // var b64moduleData =
  //   "data:text/javascript;base64," + symbolValue.toString("base64");
  // // dynamic import module from string
  // renderTemplates[key] = await import(b64moduleData);
}

async function handleSymbolGet(req, res, groups) {
  const { key } = groups;
  const { meta, value } = await sym.get(key);
  if (meta.empty) {
    res.writeHead(302, {
      Location: `/e/${key}`,
    });
    res.end();
    return true;
  }

  if (
    meta.type === "text/html" &&
    meta.etag !== getSha1(value.toString("utf8"))
  ) {
    throw new Error(`sha1 mismatch for ${key}`);
  }

  if (meta.etag) {
    // TODO: research Cache-Control and ETag headers
    res.setHeader(
      "Cache-Control",
      "max-age=10000, stale-while-revalidate=10000"
    );
    res.setHeader("ETag", meta.etag);
  }
  res.writeHead(200, {
    "Content-Type": meta.type,
  });
  res.end(value);
  return true;
}

async function handleEdit(req, res, groups) {
  const { key } = groups;
  const nodeAtKey = await sym.get(key);
  // if node at key is empty create the empty value for type ""
  if (nodeAtKey.meta.empty) {
    nodeAtKey.value = "";
  }

  const css = baseCss();
  const body = editorBody(nodeAtKey);
  const html = baseHtml(nodeAtKey.key, body, [], css);
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
}

async function handleEditIndex(req, res, groups) {
  const key = idGenerator();
  const nodeAtKey = await sym.get(key);
  const css = baseCss();
  const body = editorBody(nodeAtKey);
  const html = baseHtml(nodeAtKey.key, body, [], css);
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
}

function getSha1(buffer) {
  const hash = createHash("sha1");
  hash.update(buffer);
  const etag = hash.digest("hex");
  return etag;
}

async function handleSymbolPost(req, res) {
  const { key, meta, value } = await getSymbolFormData(req);

  // webkit typed via playwright enters bad double quotes
  // so we replace them with standard double quotes
  let cleanedValue = value;
  if (meta.type === "text/html") {
    // convert “ with " and “ with "
    cleanedValue = value.toString("utf8").replace(/“/g, '"').replace(/”/g, '"');
  }
  const etag = getSha1(cleanedValue);
  // delete renderTemplates[key];
  await sym.put(key, { ...meta, etag }, cleanedValue);
  const Location = `/${key}`;
  res.writeHead(302, {
    Location,
  });
  console.log(302, "POST", req.url, meta.type, key);
  res.end();
  return true;
}

async function handleSymbolPut(req, res, groups) {
  const { key } = groups;
  const type = req.headers["content-type"];
  // load request body into a buffer
  let buffer;
  for await (const chunk of req) {
    if (!buffer) {
      buffer = chunk;
    } else {
      buffer = Buffer.concat([buffer, chunk]);
    }
  }

  // get sha1 hash of the buffer
  const hash = createHash("sha1");
  hash.update(buffer);
  const etag = hash.digest("hex");
  // delete renderTemplates[key];
  // @ts-ignore
  await sym.put(key, { type, etag }, buffer);
  console.log(200, "PUT", req.url, type, key);
  const Location = `/k/${key}`;
  res.writeHead(200, {
    Location,
  });
  res.end();
}

async function getSymbolFormData(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    let key;
    let type = "text/html";
    let value;
    let template;
    bb.on("file", (name, file, info) => {
      // const { filename, encoding, mimeType } = info;
      file.on("data", (data) => {}).on("close", () => {});
    });
    bb.on("field", (name, val, info) => {
      if (name === "key") {
        key = val;
      }
      if (name === "type") {
        type = val;
      }
      if (name === "message") {
        value = val;
      }
      if (name === "template") {
        template = val;
      }
    });
    bb.on("close", async () => {
      // const { keyPath } = await saveKey(key, type, data);
      const meta = { type, template };
      resolve({ key, meta, value });
    });
    bb.on("error", (err) => {
      reject(err);
    });
    req.pipe(bb);
  });
}

// HEADER TOOLS ===========================

function makeCookie(id) {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const expires = date.toUTCString();
  return `id=${id}; Expires=${expires}; Secure; HttpOnly`;
}

function putEtagHash(asset, data) {
  const hash = createHash("sha1").update(data).digest("hex");
  etagCache[asset] = hash;
  return hash;
}

function getEtagHash(asset) {
  return etagCache[asset];
}

// RESPONSE TEMPLATES ===========================
function nothing(req, res) {
  const STATUS = 404;
  console.log(STATUS, req.method, req.url);
  res.writeHead(STATUS, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
}

function methodNotAllowed(req, res) {
  const STATUS = 405;
  console.log(STATUS, req.method, req.url);
  res.writeHead(STATUS, { "Content-Type": "text/plain" });
  res.end("405 Method Not Allowed");
}

// HTTP SERVER ==================================
async function startHttp(port = 8080, storageType, mode, pubKey) {
  server = http.createServer(handleRequest);
  server.on("clientError", (err, socket) => {
    // @ts-ignore
    if (err.code === "ECONNRESET" || !socket.writable) {
      log("clientError", err);
      return;
    }
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  server = await httpWait(port);
  db = await sym.startDB(storageType, mode, pubKey);
  console.log("PUBLIC:", db.feed.key.toString("hex"));
  console.log("DISCOVERY:", db.feed.discoveryKey.toString("hex"));
  return { server, db };
}

function httpWait(port) {
  return new Promise((resolve, reject) => {
    server.listen({ port }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(server);
        log("HTTP:", `http://localhost:${port}`);
      }
    });
  });
}

function stopHttp() {
  return new Promise(async (resolve) => {
    server.close();
    await sym.stopDB();
    log("HTTP", "Server stopped");
    server.on("close", (err, socket) => {
      resolve(server);
    });
  });
}

// HELPER FUNCTIONS =============================
function log(tag, ...t) {
  tag = tag.toUpperCase();
  console.log(tag, ...t);
}

function urlMatch(request, pattern) {
  // remove any ending "/" from the request url
  const url = request.url.replace(/\/$/, "");
  const p = new URLPattern({ pathname: pattern });
  if (p.test({ pathname: url })) {
    const match = p.exec({ pathname: url });
    return { matched: true, groups: match.pathname.groups };
  }
  return { matched: false, groups: {} };
}

function idGenerator() {
  return randomUUID();
}

// export { startHttp, stopHttp, idGenerator };
