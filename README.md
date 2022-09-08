# Rho 
### Computational Media Mesh
[overview](#overview) | [architecture](#architecture) | [roadmap](#roadmap) | [install](#install) | [test](#test) | [run](#run-the-server) | [open](#open-the-browser) | [dev](#dev-tools) | [dependencies](#dependencies)

# Start
To install the program
```sh
npx https://github.com/timcash/rho 8080 ram write
npx https://github.com/timcash/rho 8081 ram read <32byte keys>
```

# Open the browser
browser: 
1. (mem) http://localhost:8081/
1. (disk) http://localhost:8080/
start creating symbols



### to start an optional tunnel on the open web
1. optionally tunnel over cloudflare to connect the old world to the peer-to-peer world
```
cloudflared tunnel list
cloudflared tunnel --name dev --hostname dev.yourdomain.io --hello-world true
cloudflared tunnel list
cloudflared tunnel cleanup dev
cloudflared tunnel delete dev
cloudflared tunnel list
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

# Roadmap
1. launch via `npx`
1. add templates `working but needs cleanup`
1. rename `key` to `symbol` to reduce confusion
1. refactor base test setup to `runner.js`
1. load fulltext from hyperbee stream
1. code assist with OpenAI Codex `started`
1. store context maps of responses from `ML assistants`
1. watch keys for changes
1. auto reload on sse event
1. fuzz testing
1. handle etags / caching `started and testing`
1. peer replication `started and testing`
1. Public key sig to write
1. add a lock `public key sig`
1. add api/esm backend then cache to hyperbee
1. accessible multi language, alt text, tap to use, audio-alts, tab targets
1. MMO Live coding

# Recently Added
1. add template selector to edit page

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
```sh
npm start [port]
```
note the port and key printed to the console

# Dev Tools
Learn more about the dev tools and how to contribute to the project.
1. [SYSTEM](SYSTEM.md)


# Dependencies
1. realtime code via C99 see https://github.com/Copilot-Language/copilot
1. noise encrypted https://github.com/rweather/noise-c
1. p2p https://github.com/hyperswarm/hyperswarm
1. keystore https://github.com/hypercore-protocol/hyperbee

# Optional Dependencies
1. OpenAi Codex API key https://beta.openai.com/docs/guides/code
2. Cloudflare or other hosting provider