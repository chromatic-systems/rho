[README](README.md)
# Priorites
1. Tests run first
1. Dont break the build
1. Test the live system
1. Clean up as you go
1. Getting started over perfecting the system

Awesome JS web-dev UX on top of `hypercore`
1. moves the server from the cloud to the bookshelf
1. Directed graph of components via `meta` keys
1. Integrated UI live browser Testing
1. Core `nodejs` modules
1. npx <repo> <port> write/read <publick key>
1. default UI is HTML ultra-light (hackable)
1. CSS from scratch + reset
1. many examples with small code to learn from
1. Integrated ML code assistant
1. no trackers
1. no PII


# Discovery Keys:
1. A link to share with others.
1. This lets other peers 
    - read
    - sparse replicate
    - (`not`) write

# Web Interface
1. no frameworks
1. no javascript version
    - images
    - text 
    - links
    - forms
    - sounds
    - no video
1. each symbol can `upgrade` to interactive
1. taged:labels and audio to enable accessiblity

# Debugger in the Loop
1. Tests and the system are built together
1. They are not separate
1. Tests are always on while developing
1. Tests are always on while deployed
1. The needs of the system drive the tests
1. Testing drives design of the system
1. Debugger is first class citizen

# SYMBLOCK Dev
1. Directed graph of components. 
1. Simple to add
1. Load code, images, text to a key.
1. Link keys together
1. Navigate the graph
1. Full Text Search
1. Templates for new keys
1. everyone has read access
1. no PII

# TYPES

# Symbols
1. Key is a unique identifier
1. scan over keys lexographically
1. publish changes to keys
1. `data` is binary blob
1. `meta` is a JSON object
1. `icon` is binary image
1. `lock` is a JSON object

# Lock
1. a list of public keys
1. verify messages on write

# TYPES
## key
- `number` key
- `type` type of key 
- `value` binary blob
- `read` array of passwords | georegion | timespan
- `write` array of passwords | georegion | timespan
- `delete` array of passwords | georegion | timespan
- `meso` {keys}
- `meta` {keys}
- `input` {keys}
- `output` {keys}
- `labels` {keys}
- `icon` png | svg | jpg | 1-2[a-z0-9]

## How does it work?
- `node:http` web server
- `hyperbee` p2p key store
- `codex` machine learning code assistant
- `node:fs` + `sse` live testing
- `TBD` live code collaboration
- `vanilla web components` collection of base components

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