import * as CFG from "../cfg";

import {
  $,
  GET,
  assert,
  parseHTMLString
} from "../utils";

export class EntityPlugin {
  constructor(kernel, name, js, html) {
    this.name = name;
    this.kernel = kernel;
    this.node = null;
    this.style = null;
    this.script = null;
    this.source = html;
    this.processUIHTML(html);
    this.object = this.compileObject(js);
    this.sandbox = this.createSandbox();
  }
  compileObject(js) {
    let str = `(() => { return ` +
      js +
    `})();`;
    let cls = eval(str);
    return new cls();
  }
  processUIHTML(html) {
    let node = parseHTMLString(html);
    let children = node.children;
    for (let ii = 0; ii < children.length; ++ii) {
      let child = children[ii];
      if (child.nodeName === "CONTENT") this.node = child;
      else if (child.nodeName === "STYLE") this.style = child;
      else if (child.nodeName === "SCRIPT") this.script = child;
    };
  }
  createSandbox() {
    // HACKY!!!
    let iframe = document.createElement("iframe");
    let html = this.source;
    iframe.addEventListener("load", () => {
      let win = iframe.contentWindow;
      let doc = iframe.contentDocument;
      win.$ = function(name) { return doc.querySelector(name); };
      win.self = this.object;
      win.Kernel = this.kernel;
    });
    iframe.src = "data:text/html;charset=utf-8," + encodeURI(
      `<link href="style.css" rel="stylesheet" type="text/css">` +
      this.style.outerHTML + this.node.innerHTML +
      `<script>setTimeout((e) => {\n` +
      this.script.innerHTML +
      `}, 250);</script>`
    );
    return iframe;
  }
};
