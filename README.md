# Rho 
### Computational Media Mesh
[overview](#overview) | [architecture](#architecture) | [roadmap](#roadmap) | [install](#install) | [test](#test) | [run](#run-the-server) | [open](#open-the-browser) | [dev](#dev-tools) | [dependencies](#dependencies)

![edit example](./public/images/globe-edit2.png)

Web Dev + P2P mesh
1. Join the mesh with `npx chromatic-systems/rho <port> write | read <publick key>`
1. moves the server from the cloud to the bookshelf
1. Directed graph of components via `meta` keys
1. Many examples with small code to learn from
1. default UI is HTML ultra-light (hackable)
1. Integrated UI live browser Testing
1. CSS from scratch + reset
1. Integrated code assistant
1. Core `node:http`
1. no trackers
1. no PII

# Start
To install the program
```sh
npx chromatic-systems/rho 8080 ram write
npx chromatic-systems/rho 8081 ram read <64 byte keys>
```

# Open the browser
1. http://localhost:8080


# Optional tunnel on the open web
1. optionally tunnel over cloudflare to connect the old world to the peer-to-peer world
```
cloudflared tunnel --name dev --hostname dev.yourdomain.io
```

# Architecture
1. `http` server on top of `hyperbee`
1. share public key to replicate
1. add a public route and now you have a CDN
1. `symbols` are stored as `key[ meta, data, ... ]` in a `hyperbee`
1. `symbols` store a few keys with different `types`
1. These are `meta` `icon` `data` `lock`
1. These types are stored as `sub` keyspace in `hyperbee`
1. a http server proxies requests to the `symbol` keyspace
1. changes live refresh the system
1. watches `/public` and loads into the `symbol` keyspace
1. runs `chromium` browser as the test client
1. all logs are piped togther for devUX
1. `routes` are defined in `http.js`
1. `templates` are optionally applied transforms to `symbols` on a HTTP GET request, the current example is `article` which is a `template` on the `edit` page selector


# Recently Added
1. add template selector to edit page
1. auto reload on sse event
1. peer replication `started and testing`

# Roadmap
1. load fulltext from hyperbee stream
1. code assist with OpenAI Codex `started`
1. handle etags / caching `started and testing`
1. add a lock `public key sig`
1. add api/esm backend then cache to hyperbee
1. accessible multi language, alt text, tap to use, audio-alts, tab targets
1. MMO Live coding
1. fuzz testing


# Install
```sh
npm install
```
# Test
```sh
npm test
```
test with debugger
```sh
npm run test:i
```

# Run the server
note the port and key printed to the console
```sh
npm start
or
node src/start.js port ram|disk write|read public-key
```
```

# Dev Tools
Learn more about the dev tools and how to contribute to the project.
1. [SYSTEM](SYSTEM.md)

# Optional Dependencies
1. OpenAi Codex API key https://beta.openai.com/docs/guides/code

## Templates
1. Globe: https://chromatic.systems/h3
1. Canvas: javascript
1. Tree: https://chromatic.systems/dag
1. Graph: https://chromatic.systems/dag
1. Timeline:
1. Table: Web HTML
1. cryptography: 
1. Map: https://deck.gl/
1. Image: Web HTML
1. Video: Web HTML
1. Audio: Web HTML
1. Text: Web HTML
1. Code: https://chromatic.systems/e/1
1. Form: Web HTML
1. List: Web HTML
1. Grid:
1. Body Track: https://www.tensorflow.org/lite/examples/pose_estimation/overview
1. Paint: https://github.com/CompVis/stable-diffusion
1. Payments: https://github.com/holepunchto/invoices
1. Calendar Custom html only
1. Chat Custom 
1. Email https://www.mailgun.com/
1. Phone https://www.twilio.com/
1. OCR https://github.com/naptha/tesseract.js
1. Map Directions https://github.com/headwaymaps/headway