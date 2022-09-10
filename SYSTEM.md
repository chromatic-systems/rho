[README](README.md)
# Priorites
1. Tests run first
1. Dont break the build
1. Test the live system
1. Clean up as you go
1. Getting started over perfecting the system

# Public Keys
1. A link to share with others.
1. This lets other peers 
    - read
    - sparse replicate
    - (`not`) write

# Debugger in the Loop
1. Tests and the system are built together
1. They are not separate
1. Tests are always on while developing
1. Tests are always on while deployed
1. The needs of the system drive the tests
1. Testing drives design of the system
1. Debugger is first class citizen


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

# Cloudflare Tunnel
```
cloudflared tunnel list
cloudflared tunnel --name dev --hostname dev.yourdomain.io --hello-world true
cloudflared tunnel list
cloudflared tunnel cleanup dev
cloudflared tunnel delete dev
cloudflared tunnel list
```

