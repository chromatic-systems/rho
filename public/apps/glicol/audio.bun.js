(() => {
  // node_modules/glicol/glicol-engine.js
  var glicol_engine_default = (t, r) => {
    const TextParameterReader2 = t;
    const RingBuffer2 = r;
    class GlicolEngine extends AudioWorkletProcessor {
      static get parameterDescriptors() {
        return [];
      }
      constructor(options) {
        super(options);
        this._codeArray = new Uint8Array(2048);
        this._paramArray = new Uint8Array(2048);
        const isLiveCoding = options.processorOptions.isLiveCoding;
        this.useSAB = options.processorOptions.useSAB;
        if (this.useSAB) {
          this._code_reader = new TextParameterReader2(
            new RingBuffer2(options.processorOptions.codeQueue, Uint8Array)
          );
          this._param_reader = new TextParameterReader2(
            new RingBuffer2(options.processorOptions.paramQueue, Uint8Array)
          );
        }
        this.port.onmessage = async (e) => {
          if (e.data.type === "load") {
            await WebAssembly.instantiate(e.data.obj, {
              env: {
                now: Date.now
              }
            }).then((obj) => {
              this._wasm = obj.instance;
              this._size = 256;
              this._wasm.exports.live_coding_mode(isLiveCoding);
              this._resultPtr = this._wasm.exports.alloc_uint8array(256);
              this._result = new Uint8Array(
                this._wasm.exports.memory.buffer,
                this._resultPtr,
                256
              );
              this._resultPtr = this._wasm.exports.alloc_uint8array(256);
              this._result = new Uint8Array(
                this._wasm.exports.memory.buffer,
                this._resultPtr,
                256
              );
              this._outPtr = this._wasm.exports.alloc(this._size);
              this._outBuf = new Float32Array(
                this._wasm.exports.memory.buffer,
                this._outPtr,
                this._size
              );
              this._wasm.exports.set_sr(sampleRate);
              this._wasm.exports.set_seed(Math.random() * 4096);
            });
            this.port.postMessage({ type: "ready" });
          } else if (e.data.type === "loadsample") {
            let channels = e.data.channels;
            let length = e.data.sample.length;
            let sr = e.data.sr;
            let samplePtr = this._wasm.exports.alloc(length);
            let sampleArrayBuffer = new Float32Array(
              this._wasm.exports.memory.buffer,
              samplePtr,
              length
            );
            sampleArrayBuffer.set(e.data.sample);
            let nameLen = e.data.name.byteLength;
            let namePtr = this._wasm.exports.alloc_uint8array(nameLen);
            let nameArrayBuffer = new Uint8Array(
              this._wasm.exports.memory.buffer,
              namePtr,
              nameLen
            );
            nameArrayBuffer.set(e.data.name);
            this._wasm.exports.add_sample(namePtr, nameLen, samplePtr, length, channels, sr);
            this._outBuf = new Float32Array(
              this._wasm.exports.memory.buffer,
              this._outPtr,
              this._size
            );
            this._result = new Uint8Array(
              this._wasm.exports.memory.buffer,
              this._resultPtr,
              256
            );
          } else if (e.data.type === "run") {
            let code = e.data.value;
            let size = code.byteLength;
            let codeUint8ArrayPtr = this._wasm.exports.alloc_uint8array(size);
            let codeUint8Array = new Uint8Array(this._wasm.exports.memory.buffer, codeUint8ArrayPtr, size);
            codeUint8Array.set(code.slice(0, size));
            this._wasm.exports.update(codeUint8ArrayPtr, size);
          } else if (e.data.type === "msg") {
            let msg = e.data.value;
            let size = msg.byteLength;
            let msgUint8ArrayPtr = this._wasm.exports.alloc_uint8array(size);
            let msgUint8Array = new Uint8Array(this._wasm.exports.memory.buffer, msgUint8ArrayPtr, size);
            msgUint8Array.set(msg.slice(0, size));
            this._wasm.exports.send_msg(msgUint8ArrayPtr, size);
          } else if (e.data.type === "bpm") {
            this._wasm.exports.set_bpm(e.data.value);
          } else if (e.data.type === "livecoding") {
            this._wasm.exports.live_coding_mode(e.data.value);
          } else if (e.data.type === "amp") {
            this._wasm.exports.set_track_amp(e.data.value);
          } else {
            throw "unexpected.";
          }
        };
      }
      process(inputs, outputs, _parameters) {
        if (!this._wasm) {
          return true;
        }
        if (this.useSAB) {
          let size = this._code_reader.dequeue(this._codeArray);
          if (size) {
            let codeUint8ArrayPtr = this._wasm.exports.alloc_uint8array(size);
            let codeUint8Array = new Uint8Array(this._wasm.exports.memory.buffer, codeUint8ArrayPtr, size);
            codeUint8Array.set(this._codeArray.slice(0, size), "this._codeArray.slice(0, size)");
            this._wasm.exports.update(codeUint8ArrayPtr, size);
          }
          let size2 = this._param_reader.dequeue(this._paramArray);
          if (size2) {
            let paramUint8ArrayPtr = this._wasm.exports.alloc_uint8array(size2);
            let paramUint8Array = new Uint8Array(this._wasm.exports.memory.buffer, paramUint8ArrayPtr, size2);
            paramUint8Array.set(this._paramArray.slice(0, size2));
            this._wasm.exports.send_msg(paramUint8ArrayPtr, size2);
          }
        }
        if (inputs[0][0]) {
          this._inPtr = this._wasm.exports.alloc(128);
          this._inBuf = new Float32Array(
            this._wasm.exports.memory.buffer,
            this._inPtr,
            128
          );
          this._inBuf.set(inputs[0][0]);
        }
        this._wasm.exports.process(
          this._inPtr,
          this._outPtr,
          this._size,
          this._resultPtr
        );
        this._outBuf = new Float32Array(
          this._wasm.exports.memory.buffer,
          this._outPtr,
          this._size
        );
        this._result = new Uint8Array(
          this._wasm.exports.memory.buffer,
          this._resultPtr,
          256
        );
        if (this._result[0] !== 0) {
          this.port.postMessage({ type: "e", info: this._result.slice(0, 256) });
        }
        outputs[0][0].set(this._outBuf.slice(0, 128));
        outputs[0][1].set(this._outBuf.slice(128, 256));
        return true;
      }
    }
    registerProcessor("glicol-engine", GlicolEngine);
  };

  // node_modules/glicol/glicol_wasm.wasm
  var glicol_wasm_default = "/k/audio/glicol_wasm-GLQDC5AB.wasm";

  // node_modules/glicol/nosab.js
  var nosab_default = `To get the best audio performance for browsers, we need SharedArrayBuffer (SAB). However, it may not be supported in current browser (see https://caniuse.com/?search=sharedarraybuffer). Also, SharedArrayBuffer requires 'cross-origin isolation', either on the dev or deployment server (see https://web.dev/coop-coep/).`;

  // node_modules/glicol/detect.js
  var detectOs = () => {
    var userAgent = window.navigator.userAgent, platform = window.navigator.platform, macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"], windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"], iosPlatforms = ["iPhone", "iPad", "iPod"], os = null;
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = "Mac OS";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = "iOS";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = "Windows";
    } else if (/Android/.test(userAgent)) {
      os = "Android";
    } else if (!os && /Linux/.test(platform)) {
      os = "Linux";
    }
    return os;
  };
  var detectBrowser = () => {
    const { userAgent } = navigator;
    let name = "";
    let version = "0.0";
    if (userAgent.includes("Firefox/")) {
      name = detectOs() === "Android" ? "Firefox for Android" : "Firefox";
      version = userAgent.split("Firefox/")[1];
    } else if (userAgent.includes("Chrome/")) {
      name = detectOs() === "Android" ? "Chrome for Android" : "Chrome";
      version = userAgent.split("Chrome/")[1].split(" ")[0].split(".")[0];
    } else if (userAgent.includes("Safari/") && userAgent.includes("Version/")) {
      name = detectOs() === "iOS" ? "Safari on iOS" : "Safari";
      version = userAgent.split("Version/")[1].split(" ")[0];
    }
    return {
      name,
      version: parseFloat(version)
    };
  };

  // node_modules/glicol/ringbuf.js
  var TextParameterWriter = class {
    constructor(ringbuf) {
      if (ringbuf.type() != "Uint8Array") {
        throw "This class requires a ring buffer of Uint8Array";
      }
      this.ringbuf = ringbuf;
    }
    enqueue(buf) {
      return this.ringbuf.push(buf);
    }
    available_write() {
      return this.ringbuf.available_write();
    }
  };
  var TextParameterReader = class {
    constructor(ringbuf) {
      if (ringbuf.type() != "Uint8Array") {
        throw "This class requires a ring buffer of Uint8Array";
      }
      this.ringbuf = ringbuf;
    }
    dequeue(buf) {
      if (this.ringbuf.empty()) {
        return 0;
      }
      return this.ringbuf.pop(buf);
    }
    available_read() {
      return this.ringbuf.available_read();
    }
  };
  var RingBuffer = class {
    static getStorageForCapacity(capacity, type) {
      if (!type.BYTES_PER_ELEMENT) {
        throw "Pass in a ArrayBuffer subclass";
      }
      var bytes = 8 + (capacity + 1) * type.BYTES_PER_ELEMENT;
      return new SharedArrayBuffer(bytes);
    }
    constructor(sab, type) {
      if (!ArrayBuffer.__proto__.isPrototypeOf(type) && type.BYTES_PER_ELEMENT !== void 0) {
        throw "Pass a concrete typed array class as second argument";
      }
      this._type = type;
      this.capacity = (sab.byteLength - 8) / type.BYTES_PER_ELEMENT;
      this.buf = sab;
      this.write_ptr = new Uint32Array(this.buf, 0, 1);
      this.read_ptr = new Uint32Array(this.buf, 4, 1);
      this.storage = new type(this.buf, 8, this.capacity);
    }
    type() {
      return this._type.name;
    }
    push(elements) {
      var rd = Atomics.load(this.read_ptr, 0);
      var wr = Atomics.load(this.write_ptr, 0);
      if ((wr + 1) % this._storage_capacity() == rd) {
        return 0;
      }
      let to_write = Math.min(this._available_write(rd, wr), elements.length);
      let first_part = Math.min(this._storage_capacity() - wr, to_write);
      let second_part = to_write - first_part;
      this._copy(elements, 0, this.storage, wr, first_part);
      this._copy(elements, first_part, this.storage, 0, second_part);
      Atomics.store(
        this.write_ptr,
        0,
        (wr + to_write) % this._storage_capacity()
      );
      return to_write;
    }
    pop(elements) {
      var rd = Atomics.load(this.read_ptr, 0);
      var wr = Atomics.load(this.write_ptr, 0);
      if (wr == rd) {
        return 0;
      }
      let to_read = Math.min(this._available_read(rd, wr), elements.length);
      let first_part = Math.min(this._storage_capacity() - rd, elements.length);
      let second_part = to_read - first_part;
      this._copy(this.storage, rd, elements, 0, first_part);
      this._copy(this.storage, 0, elements, first_part, second_part);
      Atomics.store(this.read_ptr, 0, (rd + to_read) % this._storage_capacity());
      return to_read;
    }
    empty() {
      var rd = Atomics.load(this.read_ptr, 0);
      var wr = Atomics.load(this.write_ptr, 0);
      return wr == rd;
    }
    full() {
      var rd = Atomics.load(this.read_ptr, 0);
      var wr = Atomics.load(this.write_ptr, 0);
      return (wr + 1) % this.capacity != rd;
    }
    capacity() {
      return this.capacity - 1;
    }
    available_read() {
      var rd = Atomics.load(this.read_ptr, 0);
      var wr = Atomics.load(this.write_ptr, 0);
      return this._available_read(rd, wr);
    }
    available_write() {
      var rd = Atomics.load(this.read_ptr, 0);
      var wr = Atomics.load(this.write_ptr, 0);
      return this._available_write(rd, wr);
    }
    _available_read(rd, wr) {
      if (wr > rd) {
        return wr - rd;
      } else {
        return wr + this._storage_capacity() - rd;
      }
    }
    _available_write(rd, wr) {
      let rv = rd - wr - 1;
      if (wr >= rd) {
        rv += this._storage_capacity();
      }
      return rv;
    }
    _storage_capacity() {
      return this.capacity;
    }
    _copy(input, offset_input, output, offset_output, size) {
      for (var i = 0; i < size; i++) {
        output[offset_output + i] = input[offset_input + i];
      }
    }
  };

  // node_modules/glicol/nodechain.js
  var isRef = (s) => String(s).includes("~");
  function imp(freq) {
    if (!isNaN(freq)) {
      return new NodeChain(`imp ${freq}`);
    }
  }
  var NodeChain = class {
    constructor(code) {
      this.code = code;
    }
    toString() {
      return `${this.code}`;
    }
    mul(val) {
      if (!isNaN(val) || isRef(val)) {
        this.code += ` >> mul ${val}`;
      }
      return this;
    }
    add(val) {
      if (!isNaN(val) || isRef(val)) {
        this.code += ` >> add ${val}`;
      }
      return this;
    }
    delayms(val) {
      if (!isNaN(val) || isRef(val)) {
        this.code += ` >> delayms ${val}`;
      }
      return this;
    }
    delayn(val) {
      if (!isNaN(val)) {
        this.code += ` >> delayn ${parseInt(val)}`;
      }
      return this;
    }
    lpf(cutoff, qvalue) {
      this.code += ` >> lpf ${cutoff} ${qvalue}`;
      return this;
    }
    hpf(cutoff, qvalue) {
      if ((!isNaN(cutoff) || isRef(cutoff)) && !isNaN(qvalue)) {
        this.code += ` >> hpf ${cutoff} ${qvalue}`;
      }
      return this;
    }
    plate(val) {
      if (!isNaN(val)) {
        this.code += ` >> plate ${val}`;
      }
      return this;
    }
    bd(val) {
      if (!isNaN(val)) {
        this.code += ` >> bd ${val}`;
      }
      return this;
    }
    sn(val) {
      if (!isNaN(val)) {
        this.code += ` >> sn ${val}`;
      }
      return this;
    }
    hh(val) {
      if (!isNaN(val)) {
        this.code += ` >> hh ${val}`;
      }
      return this;
    }
    sawsynth(att, dec) {
      if (!isNaN(att) && !isNaN(dec)) {
        this.code += ` >> sawsynth ${att} ${dec}`;
      }
      return this;
    }
    squsynth(att, dec) {
      if (!isNaN(att) && !isNaN(dec)) {
        this.code += ` >> squsynth ${att} ${dec}`;
      }
      return this;
    }
    trisynth(att, dec) {
      if (!isNaN(att) && !isNaN(dec)) {
        this.code += ` >> trisynth ${att} ${dec}`;
      }
      return this;
    }
    seq(str) {
      this.code += ` >> seq ${str}`;
      return this;
    }
    adsr(a, d, s, r) {
      this.code += ` >> adsr ${a} ${d} ${s} ${r}`;
      return this;
    }
    sp(sampleName) {
      this.code += ` >> sp \\${sampleName}`;
      return this;
    }
    envperc(attack, decay) {
      this.code += ` >> envperc ${attack} ${decay}`;
      return this;
    }
  };

  // node_modules/glicol/index.js
  var text = `( ${String(glicol_engine_default)} )(${TextParameterReader}, ${RingBuffer})`;
  var isSharedArrayBufferSupported = false;
  try {
    sab = new SharedArrayBuffer(1);
    ({ name, _ } = detectBrowser());
    if (sab && !name.includes("Safari")) {
      isSharedArrayBufferSupported = true;
    }
  } catch (e) {
    console.warn(nosab_default);
  }
  var sab;
  var name;
  var _;
  var Engine = class {
    constructor({
      audioContext = new AudioContext(),
      isLiveCoding = false,
      loadSamples = false,
      connectTo,
      onLoaded = () => {
      }
    } = {}) {
      (async () => {
        this.encoder = new TextEncoder("utf-8");
        this.decoder = new TextDecoder("utf-8");
        this.audioContext = audioContext;
        this.audioContext.suspend();
        const blob = new Blob([text], { type: "application/javascript" });
        const module = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(module);
        if (isSharedArrayBufferSupported) {
          let sab = RingBuffer.getStorageForCapacity(2048, Uint8Array);
          let rb = new RingBuffer(sab, Uint8Array);
          this.codeWriter = new TextParameterWriter(rb);
          let sab2 = RingBuffer.getStorageForCapacity(2048, Uint8Array);
          let rb2 = new RingBuffer(sab2, Uint8Array);
          this.paramWriter = new TextParameterWriter(rb2);
          this.node = new AudioWorkletNode(this.audioContext, "glicol-engine", {
            outputChannelCount: [2],
            processorOptions: {
              codeQueue: sab,
              paramQueue: sab2,
              useSAB: true,
              isLiveCoding
            }
          });
        } else {
          this.node = new AudioWorkletNode(this.audioContext, "glicol-engine", {
            outputChannelCount: [2],
            processorOptions: {
              useSAB: false,
              isLiveCoding
            }
          });
        }
        this.sampleBuffers = {};
        this.node.port.onmessage = async (e) => {
          this.log("%c  GLICOL loaded.  ", "background:#3b82f6; color:white; font-weight: bold; font-family: Courier");
          if (e.data.type === "ready") {
            if (Object.keys(this.sampleBuffers).length !== 0) {
              for (let key in this.sampleBuffers) {
                let buffer = this.sampleBuffers[key];
                var sample;
                if (buffer.numberOfChannels === 1) {
                  sample = buffer.getChannelData(0);
                } else if (buffer.numberOfChannels === 2) {
                  sample = new Float32Array(buffer.length * 2);
                  sample.set(buffer.getChannelData(0), 0);
                  sample.set(buffer.getChannelData(1), buffer.length);
                } else {
                  throw Error("Only support mono or stereo samples.");
                }
                this.node.port.postMessage({
                  type: "loadsample",
                  sample,
                  channels: buffer.numberOfChannels,
                  length: buffer.length,
                  name: encoder.encode("\\" + key.replace("-", "_")),
                  sr: buffer.sampleRate
                });
              }
            } else {
              if (loadSamples) {
                await this.loadSamples();
              }
            }
            onLoaded();
          } else if (e.data.type === "e") {
            if (e.data.info[0] === 1) {
              let info = this.decoder.decode(e.data.info.slice(2).filter((v) => v !== 0));
              console.log(info);
              let pos = parseInt(info.split("pos[")[1].split("]")[0]);
              let line = parseInt(info.split("line[")[1].split("]")[0]);
              let col = parseInt(info.split("col[")[1].split("]")[0]);
              let positives = info.split("positives[")[1].split("]")[0].replace("EOI", "END OF INPUT").split(",").join(" ||");
              let negatives = info.split("negatives[")[1].split("]")[0].split(",").join(" or");
              console.log(`%cError at line ${line}`, "background: #3b82f6; color:white; font-weight: bold");
              let errline = this.code.split("\n")[line - 1];
              let styleErrLine = errline.slice(0, col - 1) + "%c %c" + errline.slice(col - 1);
              console.log(styleErrLine, "font-weight: bold; background: #f472b6; color:white", "");
              let positiveResult = positives.length > 0 ? "expecting " + positives : "";
              console.log(
                `${"_".repeat(col - 1 >= 0 ? col - 1 : 0)}%c^^^ ${positiveResult}${negatives.length > 0 ? "unexpected " + negatives : ""}`,
                "font-weight: bold; background: #f472b6; color:white"
              );
            } else {
              console.log(
                `%c${this.decoder.decode(e.data.info.slice(2).filter((v) => v !== 0))}`,
                "font-weight: bold; background: #f472b6; color:white"
              );
            }
          }
        };
        if (!connectTo) {
          this.node.connect(this.audioContext.destination);
        } else {
          this.node.connect(connectTo);
        }
        let url = String(glicol_wasm_default).replaceAll(" ", "");
        let urlSplit = url.split("/");
        urlSplit.shift();
        let urlNoHead = "/" + urlSplit.join("/");
        let finalUrl = urlNoHead.split(".wasm")[0] + ".wasm";
        fetch(finalUrl).then((response) => response.arrayBuffer()).then((arrayBuffer) => {
          this.node.port.postMessage({
            type: "load",
            obj: arrayBuffer
          });
        }).catch((e) => {
          console.log(e);
          console.error("fail to load the wasm module. please report it here: https://github.com/chaosprint/glicol");
        });
      })();
    }
    run(code) {
      this.audioContext.resume();
      if (isSharedArrayBufferSupported) {
        if (this.codeWriter.available_write()) {
          this.codeWriter.enqueue(this.encoder.encode(code));
        }
      } else {
        this.node.port.postMessage({
          type: "run",
          value: this.encoder.encode(code)
        });
      }
    }
    sendMsg(msg) {
      let str;
      str = msg.slice(-1) === ";" ? msg : msg + ";";
      if (isSharedArrayBufferSupported) {
        if (this.paramWriter.available_write()) {
          this.paramWriter.enqueue(this.encoder.encode(str));
        }
      } else {
        this.node.port.postMessage({
          type: "msg",
          value: this.encoder.encode(str)
        });
      }
    }
    setBPM(bpm) {
      this.node.port.postMessage({
        type: "bpm",
        value: bpm
      });
    }
    liveCodingMode(yes_or_no) {
      this.node.port.postMessage({
        type: "livecoding",
        value: yes_or_no
      });
    }
    connect(target) {
      this.node.connect(target);
    }
    reset() {
    }
    play(obj) {
      let code = ``;
      for (let key in obj) {
        code += key + ": ";
        code += obj[key].code + ";\n\n";
      }
      console.log(code);
      this.code = code;
      this.run(code);
    }
    stop() {
      this.run("");
    }
    showAllSamples() {
      console.table(Object.keys(this.sampleBuffers));
      return ``;
    }
    async addSampleFiles(name, url) {
      if (url === void 0) {
        var input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = (e) => {
          var files = e.target.files;
          for (var i = 0; i < files.length; i++) {
            ((file) => {
              var reader = new FileReader();
              reader.onload = async (e2) => {
                let name2 = file.name.toLowerCase().replace(".wav", "").replace(".mp3", "").replaceAll("-", "_").replaceAll(" ", "_").replaceAll("#", "_sharp_");
                await this.audioContext.decodeAudioData(e2.target.result, (buffer) => {
                  this.sampleBuffers[name2] = buffer;
                  var sample;
                  if (buffer.numberOfChannels === 1) {
                    sample = buffer.getChannelData(0);
                  } else if (buffer.numberOfChannels === 2) {
                    sample = new Float32Array(buffer.length * 2);
                    sample.set(buffer.getChannelData(0), 0);
                    sample.set(buffer.getChannelData(1), buffer.length);
                  } else {
                    throw Error("Only support mono or stereo samples.");
                  }
                  console.log("loading sample: ", name2);
                  this.node.port.postMessage({
                    type: "loadsample",
                    sample,
                    channels: buffer.numberOfChannels,
                    length: buffer.length,
                    name: this.encoder.encode("\\" + name2),
                    sr: buffer.sampleRate
                  });
                });
              };
              reader.readAsArrayBuffer(file);
            })(files[i]);
          }
        };
        input.click();
      } else {
        this.audioContext.suspend();
        let myRequest = new Request(url);
        await fetch(myRequest).then((response) => response.arrayBuffer()).then((arrayBuffer) => {
          this.audioContext.decodeAudioData(arrayBuffer, (buffer) => {
            this.sampleBuffers[name] = buffer;
            var sample;
            if (buffer.numberOfChannels === 1) {
              sample = buffer.getChannelData(0);
            } else if (buffer.numberOfChannels === 2) {
              sample = new Float32Array(buffer.length * 2);
              sample.set(buffer.getChannelData(0), 0);
              sample.set(buffer.getChannelData(1), buffer.length);
            } else {
              throw Error("Only support mono or stereo samples.");
            }
            this.node.port.postMessage({
              type: "loadsample",
              sample,
              channels: buffer.numberOfChannels,
              length: buffer.length,
              name: this.encoder.encode("\\" + name),
              sr: buffer.sampleRate
            });
          }, function(e) {
            console.log("Error with decoding audio data" + e.err);
          });
        });
        this.audioContext.resume();
      }
    }
    addSampleFromDataArray(name, sample, numberOfChannels, length, sampleRate2) {
      this.node.port.postMessage({
        type: "loadsample",
        sample,
        channels: numberOfChannels,
        length,
        name: this.encoder.encode("\\" + name),
        sr: sampleRate2
      });
    }
    async loadSamples() {
      let source = `https://cdn.jsdelivr.net/gh/chaosprint/glicol@v0.11.9/js/src/`;
      fetch(source + "sample-list.json").then((response) => response.json()).then((data) => {
        Object.keys(data).filter((name) => name !== "2json.js").forEach(async (name) => {
          let myRequest = new Request(source.replace("src/", "") + `assets/${name}.wav`);
          await fetch(myRequest).then((response) => response.arrayBuffer()).then((arrayBuffer) => {
            this.audioContext.decodeAudioData(arrayBuffer, (buffer) => {
              this.sampleBuffers[name] = buffer;
              var sample;
              if (buffer.numberOfChannels === 1) {
                sample = buffer.getChannelData(0);
              } else if (buffer.numberOfChannels === 2) {
                sample = new Float32Array(buffer.length * 2);
                sample.set(buffer.getChannelData(0), 0);
                sample.set(buffer.getChannelData(1), buffer.length);
              } else {
                throw Error("Only support mono or stereo samples.");
              }
              this.node.port.postMessage({
                type: "loadsample",
                sample,
                channels: buffer.numberOfChannels,
                length: buffer.length,
                name: this.encoder.encode("\\" + name.replace("-", "_")),
                sr: buffer.sampleRate
              });
            }, function(e) {
              console.log("Error with decoding audio data" + e.err + name);
            });
          });
        });
      });
    }
    log(...params) {
      setTimeout(console.log.bind(console, ...params));
    }
  };
  var glicol_default = Engine;

  // public/audio/audio.js
  var glicol = new glicol_default({ loadSamples: true });
  var play = document.querySelector("#play");
  play.addEventListener("click", () => {
    // glicol.showAllSamples()
    glicol.play({
      "o": imp(1).sp("ride")
    });
  });
})();
