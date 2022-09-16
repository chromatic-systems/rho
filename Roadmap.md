# Roadmap

## Web Auth
#### https://webkit.org/blog/13152/webkit-features-in-safari-16-0/
The technology that makes passkeys possible is defined in open standards from the FIDO Alliance and the W3C, including the WebAuthn standard, which already has widespread support in browsers. Passkeys are an industry-wide effort, and “passkeys” is a common noun, to be used by anyone. You can offer passkeys alongside your existing authentication options. First, teach your backend to store public keys and issue authentication challenges. Then, on your website or web app, offer passkeys to users by adopting the APIs for creating new passkeys and allowing users to sign in with their passkey.

If your website or web app already supports using a platform authenticator with WebAuthn, there are a few things to note as you add support for passkeys. Make sure you aren’t limiting signing in to the device that saved the passkey; that is, don’t use a cookie to “remember” that a user set up a key on a particular device. Also, make sure the username fields in your existing sign-in forms are compatible with AutoFill by adopting “conditional mediation”. Finally, start to refer to passkeys, and treat them as a primary way to sign in.

To learn more, watch the WWDC22 session, Meet Passkeys (27 min video) or read Supporting passkeys. In October, support for passkeys will come to macOS Monterey and macOS Big Sur, as well as macOS Ventura and iPadOS.

# Peer-to-Peer Encryption
#### https://github.com/hypercore-protocol/hypercore
Hypercore Protocol is a peer-to-peer data network built on the Hypercore logs. Hypercores are signed, append-only logs. They're like lightweight blockchains without the consensus algorithm. As with BitTorrent, as more people "seed" a dataset it will increase the available bandwidth.

# Codex
#### https://ar5iv.labs.arxiv.org/html/2107.03374
Codex, a GPT language model fine-tuned on publicly available code from GitHub, and study its Python code-writing capabilities. A distinct production version of Codex powers GitHub Copilot. On HumanEval, a new evaluation set we release to measure functional correctness for synthesizing programs from docstrings, our model solves 28.8% of the problems, while GPT-3 solves 0% and GPT-J solves 11.4%. Furthermore, we find that repeated sampling from the model is a surprisingly effective strategy for producing working solutions to difficult prompts. Using this method, we solve 70.2% of our problems with 100 samples per problem. Careful investigation of our model reveals its limitations, including difficulty with docstrings describing long chains of operations and with binding operations to variables. Finally, we discuss the potential broader impacts of deploying powerful code generation technologies, covering safety, security, and economics.

# Memlab
#### https://github.com/facebookincubator/memlab
memlab is an E2E testing and analysis framework for finding JavaScript memory leaks and optimization opportunities.

# No modern tools for Building Intelligence Modeling
Most tools look like this
1. https://market.bimsmith.com/IFC
Revit tools also look like they could be improved

# VM-Module
https://nodejs.org/api/vm.html#class-vmmodule
This feature is only available with the --experimental-vm-modules command flag enabled.

The vm.Module class provides a low-level interface for using ECMAScript modules in VM contexts. It is the counterpart of the vm.Script class that closely mirrors Module Records as defined in the ECMAScript specification.

Unlike vm.Script however, every vm.Module object is bound to a context from its creation. Operations on vm.Module objects are intrinsically asynchronous, in contrast with the synchronous nature of vm.Script objects. The use of 'async' functions can help with manipulating vm.Module objects.

Using a vm.Module object requires three distinct steps: creation/parsing, linking, and evaluation. These three steps are illustrated in the following example.

This implementation lies at a lower level than the ECMAScript Module loader. There is also no way to interact with the Loader yet, though support is planned.
```js
import vm from 'node:vm';

const contextifiedObject = vm.createContext({
  secret: 42,
  print: console.log,
});

// Step 1
//
// Create a Module by constructing a new `vm.SourceTextModule` object. This
// parses the provided source text, throwing a `SyntaxError` if anything goes
// wrong. By default, a Module is created in the top context. But here, we
// specify `contextifiedObject` as the context this Module belongs to.
//
// Here, we attempt to obtain the default export from the module "foo", and
// put it into local binding "secret".

const bar = new vm.SourceTextModule(`
  import s from 'foo';
  s;
  print(s);
`, { context: contextifiedObject });

// Step 2
//
// "Link" the imported dependencies of this Module to it.
//
// The provided linking callback (the "linker") accepts two arguments: the
// parent module (`bar` in this case) and the string that is the specifier of
// the imported module. The callback is expected to return a Module that
// corresponds to the provided specifier, with certain requirements documented
// in `module.link()`.
//
// If linking has not started for the returned Module, the same linker
// callback will be called on the returned Module.
//
// Even top-level Modules without dependencies must be explicitly linked. The
// callback provided would never be called, however.
//
// The link() method returns a Promise that will be resolved when all the
// Promises returned by the linker resolve.
//
// Note: This is a contrived example in that the linker function creates a new
// "foo" module every time it is called. In a full-fledged module system, a
// cache would probably be used to avoid duplicated modules.

async function linker(specifier, referencingModule) {
  if (specifier === 'foo') {
    return new vm.SourceTextModule(`
      // The "secret" variable refers to the global variable we added to
      // "contextifiedObject" when creating the context.
      export default secret;
    `, { context: referencingModule.context });

    // Using `contextifiedObject` instead of `referencingModule.context`
    // here would work as well.
  }
  throw new Error(`Unable to resolve dependency: ${specifier}`);
}
await bar.link(linker);

// Step 3
//
// Evaluate the Module. The evaluate() method returns a promise which will
// resolve after the module has finished evaluating.

// Prints 42.
await bar.evaluate();
```

# Clifford Neural Layers for PDE Modeling
#### https://arxiv.org/pdf/2209.04934.pdf
Johannes Brandstetter1
, Rianne van den Berg1
, Max Welling1
, and Jayesh K. Gupta2

Partial differential equations (PDEs) see widespread use in sciences and engineering to describe simulation of physical processes as scalar and vector fields interacting and coevolving
over time. Due to the computationally expensive nature of their standard solution methods,
neural PDE surrogates have become an active research topic to accelerate these simulations.
However, current methods do not explicitly take into account the relationship between different fields and their internal components, which are often correlated. Viewing the time
evolution of such correlated fields through the lens of multivector fields allows us to overcome these limitations. Multivector fields consist of scalar, vector, as well as higher-order
components, such as bivectors and trivectors. Their algebraic properties, such as multiplication, addition and other arithmetic operations can be described by Clifford algebras. To our
knowledge, this paper presents the first usage of such multivector representations together
with Clifford convolutions and Clifford Fourier transforms in the context of deep learning.
The resulting Clifford neural layers are universally applicable and will find direct use in the
areas of fluid dynamics, weather forecasting, and the modeling of physical systems in general. We empirically evaluate the benefit of Clifford neural layers by replacing convolution
and Fourier operations in common neural PDE surrogates by their Clifford counterparts on
two-dimensional Navier-Stokes and weather modeling tasks, as well as three-dimensional
Maxwell equations. Clifford neural layers consistently improve generalization capabilities
of the tested neural PDE surrogates.