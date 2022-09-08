import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldKeymap,
} from "@codemirror/language";
import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { html } from "@codemirror/lang-html";
import { chroma_theme } from "./theme";

class Editor extends HTMLElement {
  constructor() {
    super();
    this.key = this.getAttribute("data-key");
    this.title = this.getAttribute("data-title");

    const save = async () => {
      // get password value from input
      const password = document.getElementById("password").value;
      await fetch(`/k/${this.key}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/html",
          auth: password,
        },
        body: this.text,
      });
    }

    const gotoKey = async () => {
      window.location.href = `/k/${this.key}`;
    }

    const saveKeymap = [
      { key: "Mod-s", run: save, preventDefault: true },
      { key: "Mod-k", run: gotoKey, preventDefault: true }
    ];

    this.basicSetup = [
      // lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, {
        fallback: true,
      }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        ...saveKeymap,
      ]),
    ];
  }
  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    const response = await fetch(`/k/${this.key}`);
    // if mimetype is html, css or js else throw error
    const mimetype = response.headers.get("content-type");
    // match html,css or javascript or json
    const match = mimetype.match(/^(text\/plain|text\/html|text\/css|application\/javascript|application\/json)/);
    if (!match) {
      throw new Error(`mimetype:${mimetype} not supported`);
    }
    const doc = await response.text();

    this.editView = new EditorView({
      doc,
      extensions: [
        this.basicSetup,
        //keymap.of([indentWithTab]),
        chroma_theme,
        html(),
      ],
      parent: this.shadowRoot,
    });

    this.editView.focus();
  }

  disconnectedCallback() {}

  get text() {
    const iter = Array.from(this.editView.state.doc.iterLines())
    const t = iter.join("\n");
    return t;
  }
}

customElements.define("edit-code", Editor);

// SIMPLE EXAMPLE OF SET GET OBSERVE and REFLECTION onto properties
/* 
export class MyCustomElement extends HTMLElement {
  ...
  
  get disabled() {
    return this.hasAttribute('disabled');
  }
  
  set disabled(val) {
    if(val) {
      this.setAttribute('disabled', val);
    } else {
      this.removeAttribute('disabled');
    }
  }
}

static get observedAttributes() {
  return ['disabled'];
}

attributeChangedCallback(name, oldValue, newValue) {
  this.disabled = newValue;  
}
*/
