# Roadmap

## Web Auth
#### https://webkit.org/blog/13152/webkit-features-in-safari-16-0/
The technology that makes passkeys possible is defined in open standards from the FIDO Alliance and the W3C, including the WebAuthn standard, which already has widespread support in browsers. Passkeys are an industry-wide effort, and “passkeys” is a common noun, to be used by anyone. You can offer passkeys alongside your existing authentication options. First, teach your backend to store public keys and issue authentication challenges. Then, on your website or web app, offer passkeys to users by adopting the APIs for creating new passkeys and allowing users to sign in with their passkey.

If your website or web app already supports using a platform authenticator with WebAuthn, there are a few things to note as you add support for passkeys. Make sure you aren’t limiting signing in to the device that saved the passkey; that is, don’t use a cookie to “remember” that a user set up a key on a particular device. Also, make sure the username fields in your existing sign-in forms are compatible with AutoFill by adopting “conditional mediation”. Finally, start to refer to passkeys, and treat them as a primary way to sign in.

To learn more, watch the WWDC22 session, Meet Passkeys (27 min video) or read Supporting passkeys. In October, support for passkeys will come to macOS Monterey and macOS Big Sur, as well as macOS Ventura and iPadOS.

## Peer-to-Peer Encryption
#### https://github.com/hypercore-protocol/hypercore
Hypercore Protocol is a peer-to-peer data network built on the Hypercore logs. Hypercores are signed, append-only logs. They're like lightweight blockchains without the consensus algorithm. As with BitTorrent, as more people "seed" a dataset it will increase the available bandwidth.

## Codex
#### https://ar5iv.labs.arxiv.org/html/2107.03374
Codex, a GPT language model fine-tuned on publicly available code from GitHub, and study its Python code-writing capabilities. A distinct production version of Codex powers GitHub Copilot. On HumanEval, a new evaluation set we release to measure functional correctness for synthesizing programs from docstrings, our model solves 28.8% of the problems, while GPT-3 solves 0% and GPT-J solves 11.4%. Furthermore, we find that repeated sampling from the model is a surprisingly effective strategy for producing working solutions to difficult prompts. Using this method, we solve 70.2% of our problems with 100 samples per problem. Careful investigation of our model reveals its limitations, including difficulty with docstrings describing long chains of operations and with binding operations to variables. Finally, we discuss the potential broader impacts of deploying powerful code generation technologies, covering safety, security, and economics.