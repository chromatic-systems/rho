// INTERNAL LIBRARIES ===============================
import * as template from "./template.js";
import { log, logLevels as ll } from "./log.js";

// EXTERNAL LIBRARIES ===========================
import http from "node:http";
import busboy from "busboy";
import { randomUUID, createHash } from "node:crypto";

const allowedMethods = ["HEAD", "CONNECT", "GET", "POST", "PUT", "DELETE"];

class Http {
  port;
  server;
  db;
  host;
  baseUrl;
  renderTemplates;
  etagCache;
  clientHandles;

  constructor({ port, db }) {
    this.port = port;
    this.db = db;
    this.host = `http://localhost`;
    this.baseUrl = `${this.host}:${this.port}`;
    // TODO: load these from a symbol, for now use a module
    this.renderTemplates = template;

    // TODO: hook up the etag UI configuation per symbol
    this.etagCache = {};
    this.clientHandles = {};
    this.watchedKeys = {};
  }

  async start() {
    // @ts-ignore: Property 'UrlPattern' does not exist
    if (!globalThis.URLPattern) {
      await import("urlpattern-polyfill");
    }

    this.server = http.createServer(this.handleRequest.bind(this));
    this.server.on("clientError", (err, socket) => {
      // @ts-ignore
      if (err.code === "ECONNRESET" || !socket.writable) {
        log(ll.alert, "clientError", err);
        return;
      }
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    });

    await this.listen(this.port);

    const cleanup = this.db.watch((err, data) => {
      if (err) {
        log(ll.alert, "WATCH ERROR", err);
        return;
      }

      this.clientHandles[data.key]?.forEach((c) => {
        log(ll.info, "SSE:RELOAD", c.id);
        const sseData = `data: reload\n\n`;
        c.handle.write(sseData);
      });
    });

    return { server: this.server };
  }

  async listen(port) {
    return new Promise((resolve, reject) => {
      this.server.listen({ port }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
          log(ll.info, "HTTP:", `${this.host}:${port}`);
        }
      });
    });
  }

  async handleRequest(req, res) {
    if (!allowedMethods.includes(req.method)) {
      methodNotAllowed(req, res);
      return;
    }

    // console.log("REQ", req.method, req.url);
    // if req.url ends with a /, replace it with /index.html
    if (req.url.endsWith("/")) {
      req.url = req.url + "index.html";
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
        const stream = this.db.stream();
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
        await this.handleNav(req, res, groups);
        return;
      }
    }

    // NAVIGATION /n
    {
      const { matched, groups } = urlMatch(req, "/n");
      if (matched) {
        await this.handleNav(req, res, { key: "index.html" });
        return;
      }
    }

    // META /m/:key
    {
      const { matched, groups } = urlMatch(req, "/m/:key*");
      if (matched) {
        await this.handleMeta(req, res, groups);
        return;
      }
    }

    // EDITOR /e
    {
      const { matched, groups } = urlMatch(req, "/e");
      if (matched) {
        await this.handleEdit(req, res, { key: "index.html" });
        return;
      }
    }

    // EDITOR /e/:key
    {
      const { matched, groups } = urlMatch(req, "/e/:key*");
      if (matched) {
        await this.handleEdit(req, res, groups);
        return;
      }
    }

    // KEY INDEX /k
    {
      const { matched } = urlMatch(req, "/k");
      if (matched && req.method === "POST") {
        await this.handleSymbolPost(req, res);
        return;
      }

      if (matched && req.method === "GET") {
        const result = await this.db.list();
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
        await this.handleSymbolPut(req, res, groups);
        return;
      }

      if (matched && req.method === "DELETE") {
        await this.handleSymbolDelete(req, res, groups);
        return;
      }

      if (matched && req.method === "GET") {
        await this.handleSymbolGet(req, res, groups);
        return;
      }
    }

    if (req.url === "/sse") {
      this.handleSSE(req, res);
      return;
    }

    let preKey = req.url;
    {
      // remove the leading / if it exists
      const key = preKey.replace(/^\//, "");
      const result = await this.handleTemplateGet(req, res, { key });
      if (result) return;

      this._404(req, res, key);
    }
  }

  async _404(req, res, key) {
    const html = this.renderTemplates._404(key);
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(html);
  }

  // HANDLERS =====================================
  async handleSSE(req, res) {
    // get the referer
    const referer = req.headers.referer;
    const myURL = new URL(referer);
    let key = myURL.pathname;
    // remove the leading / if it exists
    key = key.replace(/^\//, "");
    // remove k/ m/ n/ e/ if it exists
    key = key.replace(/^(k|m|n|e)\//, "");
    if (key === "") {
      key = "index.html";
    }

    const headers = {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    };
    res.writeHead(200, headers);

    const id = randomUUID();
    const c = this.addSSEClient(id, res, key);
    // this.watchKey(key)

    req.on("close", () => {
      this.removeSSEClient(id);
    });
    return true
  }

  addSSEClient(id, handle, key) {
    if (!this.clientHandles[key]) {
      this.clientHandles[key] = [];
    }
    this.clientHandles[key].push({ handle, id });
  }

  removeSSEClient(id) {
    const keys = Object.keys(this.clientHandles);
    for (const key of keys) {
      // filter out the item with the id
      this.clientHandles[key] = this.clientHandles[key].filter(
        (client) => client.id !== id
      );
    }
  }

  async handleNav(req, res, navGroups) {
    const { key } = navGroups;
    const node = await this.db.get(key);
    if (node) {
      // a simple html page as a string with the key in it
      const body = this.renderTemplates.navBody(node);
      const css = this.renderTemplates.baseCss();
      const html = this.renderTemplates.baseHtml(node.key, body, "", css);
      const headers = { "Content-Type": node.meta.type };
      res.writeHead(200, headers);
      res.end(html);
    } else {
      this._404(req, res, key);
    }
  }

  async handleMeta(req, res, groups) {
    const { key } = groups;
    const nodeAtKey = await this.db.get(key);
    const { meta, value } = nodeAtKey;
    const mime = "text/html";
    const html = this.renderTemplates.metaDataHtml(key, meta);
    res.writeHead(200, { "Content-Type": mime });
    res.end(html);
  }

  async handleSymbolDelete(req, res, groups) {
    const { key } = groups;
    await this.db.del(key);
    res.writeHead(200);
    res.end();
  }

  async handleTemplateGet(req, res, groups) {
    const { key } = groups;
    const symbol = await this.db.get(key);
    const { meta, value } = symbol;

    if (meta.empty) {
      return false;
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

    let template = this.renderTemplates[meta.template];

    // Get the template if it is not in the cache
    if (template == null) {
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
    // this.renderTemplates[key] = await import(b64moduleData);
  }

  async handleSymbolGet(req, res, groups) {
    const { key } = groups;
    const { meta, value } = await this.db.get(key);

    if (meta.empty) {
      this._404(req, res, key);
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
      // res.setHeader(
      //   "Cache-Control",
      //   "max-age=10000, stale-while-revalidate=10000"
      // );
      // res.setHeader("ETag", meta.etag);
    }
    res.writeHead(200, {
      "Content-Type": meta.type,
    });
    res.end(value);
    return true;
  }

  async handleEdit(req, res, groups) {
    const { key } = groups;
    const nodeAtKey = await this.db.get(key);
    // if node at key is empty create the empty value for type ""
    if (nodeAtKey.meta.empty) {
      nodeAtKey.value = "";
    }

    const css = this.renderTemplates.baseCss();
    const body = this.renderTemplates.editorBody(nodeAtKey);
    const html = this.renderTemplates.baseHtml(nodeAtKey.key, body, [], css);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return true;
  }

  async handleEditIndex(req, res, groups) {
    const key = idGenerator();
    const nodeAtKey = await this.db.get(key);
    const css = this.renderTemplates.baseCss();
    const body = this.renderTemplates.editorBody(nodeAtKey);
    const html = this.renderTemplates.baseHtml(nodeAtKey.key, body, [], css);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return true;
  }

  async handleSymbolPost(req, res) {
    const { key, meta, value } = await getSymbolFormData(req);
    // webkit typed via playwright enters bad double quotes
    // so we replace them with standard double quotes
    let cleanedValue = value;
    if (meta.type === "text/html") {
      cleanedValue = value
        .toString("utf8")
        .replace(/“/g, '"')
        .replace(/”/g, '"');
    }

    // etag prep
    const etag = getSha1(cleanedValue);

    // clear the render template cache
    // delete this.renderTemplates[key];

    // put the key and redirect to the saved key
    await this.db.put(key, { ...meta, etag }, cleanedValue);
    const Location = `/${key}`;
    res.writeHead(302, {
      Location,
    });

    res.end();
    return true;
  }

  async handleSymbolPut(req, res, groups) {
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
    // delete this.renderTemplates[key];
    await this.db.put(key, { type, etag }, buffer);

    const Location = `/k/${key}`;
    res.writeHead(200, {
      Location,
    });
    res.end();
    return true;
  }

  putEtagHash(asset, data) {
    const hash = createHash("sha1").update(data).digest("hex");
    this.etagCache[asset] = hash;
    return hash;
  }

  getEtagHash(asset) {
    return this.etagCache[asset];
  }

  // // Should be idempotent
  // watchKey(key) {
  //   console.log("watching key", key);
  //   if (this.watchedKeys[key]) return;


  //   this.watchedKeys[key] = cleanup;
  // }

  async stop() {
    this.server.close();
  }
}

export default Http;

// HEADER TOOLS ===========================
function makeCookie(id) {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const expires = date.toUTCString();
  return `id=${id}; Expires=${expires}; Secure; HttpOnly`;
}

// RESPONSE TEMPLATES ===========================
function methodNotAllowed(req, res) {
  const STATUS = 405;
  res.writeHead(STATUS, { "Content-Type": "text/plain" });
  res.end("405 Method Not Allowed");
}

// HELPERS =====================================
function urlMatch(request, pattern) {
  // remove any ending "/" from the request url
  const url = request.url;
  const p = new URLPattern({ pathname: pattern });
  if (p.test({ pathname: url })) {
    const match = p.exec({ pathname: url });
    return { matched: true, groups: match.pathname.groups };
  }
  return { matched: false, groups: {} };
}

function getSha1(buffer) {
  const hash = createHash("sha1");
  hash.update(buffer);
  const etag = hash.digest("hex");
  return etag;
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

function idGenerator() {
  return randomUUID();
}
