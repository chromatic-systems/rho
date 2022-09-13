function styles() {
  return `
  <style>
  *:where(:not(iframe, canvas, img, svg, video):not(svg *, symbol *)) {
    all: unset;
    display: revert;
  }
  
  /* Preferred box-sizing value */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
    :root {
      font-family: Monaco; 
    }
    nav {
      width: 100vw;
      position: absolute;
      top: 0;
      left: 0;
      background-color: #000000;
      z-index: 2;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1em;
      padding: 1em;
      flex-direction: column;
      overflow-y: auto;
    }
    nav > a {
      width: 100%;
      padding: 0.5em;
      text-align: center;
      font-size: 2em;
      font-weight: bold;
      cursor: pointer;
      color: white;
      border: 1px solid var(--color-border);
    }
    a:link {
      text-decoration: none;
    }
    a:hover {
      background-color: var(--color-aware);
    }
    a:focus {
      background-color: var(--color-aware);
      color: var(--color-background);
    }
    #menu {
      padding: 0 10px 5px 10px;
      cursor: pointer;
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-size: 1.5em;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
      border-radius: 20px 20px;
      z-index: 2;
    }
    #edit {
      padding: 0 10px 5px 10px;
      cursor: pointer;
      position: fixed;
      bottom: 60px;
      right: 20px;
      font-size: 1.5em;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
      border-radius: 20px 20px;
      z-index: 2;
    }

    button:hover {
      background-color: var(--color-aware);
      color: var(--color-background);
    }

    </style>
    `;
}

function template(symbol, editSymbol) {
  return `
  <nav>
      <a tabindex="1" href="/">Home</a>
      <a tabindex="3" href="/apps/globe3/">Globe</a>
      <a tabindex="4" href="/apps/upload/">Upload</a>
      <a tabindex="5" href="/apps/record/">Record</a>
      <a tabindex="6" href="/apps/ifc/">Model</a>
      <a tabindex="7" href="/apps/orbit/">Orbit</a>
      <a tabindex="8" href="/apps/mathjax/">Jax</a>
      <a tabindex="9" href="/apps/chess/">Chess</a>
      <a tabindex="10" href="/apps/dag/">Dag</a>
  </nav>
  <button id="menu" aria-label="menu">${symbol}</button>
  <button id="edit" aria-label="edit">${editSymbol}</button>
  `
}

class Navigation extends HTMLElement {
  connectedCallback(key, title) {
  this.key = this.getAttribute("data-key");
    this.title = title
    this.attachShadow({ mode: "open" });
    const trigram = "☰";
    const editSymbol = "✎";
    this.shadowRoot.innerHTML = styles() + template(trigram, editSymbol);
    
    const linksElement = this.shadowRoot.querySelector("nav");
    const titleElement = this.shadowRoot.querySelector("#menu");
    const editElement = this.shadowRoot.querySelector("#edit");
    linksElement.style.display = "none";

    // anytime a link is clicked, hide the linksElement
    linksElement.addEventListener("click", () => {
      linksElement.style.display = "none";
    });

    const toggle = () => {
      if(linksElement.style.display === "none") {
        linksElement.style.display = "flex";
        const firstChild = linksElement.firstElementChild;
        firstChild.focus();
        //linksElement.scrollIntoView({ behavior: "smooth" });
        return;
      }
      linksElement.style.display = "none";
    };

    const activateEdit = () => {
      // redirect the page to the edit page
      window.location.href = "/e/" + this.key;
    }
    // scroll page to 0,0
    //window.scrollTo({ top: 0, behavior: 'smooth' });

    titleElement.addEventListener("click", toggle);
    editElement.addEventListener("click", activateEdit);
    // on meta-shift-L toggle
    document.addEventListener("keydown", (e) => {
      // console.log(e.key);
      // console.log(e.shiftKey)
      // console.log(e.metaKey)
      // console.log(e.code)
      if(e.metaKey && e.shiftKey && e.code === "KeyL") {
        toggle();
      }
    });
  }

  disconnectedCallback() {}
}

customElements.define("nav-bar", Navigation);
