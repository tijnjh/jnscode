import "./style.css";

import { emmetHTML } from "emmet-monaco-es";

import { code } from "./lib/state.js";

import "./lib/format.js";
import "./lib/resize-handler.js";

// import { theme } from "./lib/theme.js";
import { toast } from "./lib/toast.js";
import { padBase64, extractTitle } from "./lib/utils.js";

//////////////////
// dom bindings //
//////////////////

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const elTitle = $("title");

const elEditorHtml = $("#editor-html");
const elEditorCss = $("#editor-css");
const elEditorJs = $("#editor-js");

const elPreview = $("#preview");

const elEditCodeBtn = $("#edit-code-btn");
const elClearBtn = $("#clear-btn");
const elRunBtns = $$(".run-btn");
const elShareBtns = $$(".share-btn");

///////////////////
// monaco editor //
///////////////////

require.config({ paths: { vs: "../../node_modules/monaco-editor/min/vs" } });
require(["vs/editor/editor.main"], () => {
  e.html = monaco.editor.create(elEditorHtml, configWithLang("html"));
  e.css = monaco.editor.create(elEditorCss, configWithLang("css"));
  e.js = monaco.editor.create(elEditorJs, configWithLang("javascript"));

  emmetHTML(monaco);

  activeEditor = e.html;

  // if (dataParam !== null && dataParam.trim() !== "") {
  //   for (const e of editors) {
  //     e.updateOptions({ readOnly: true });

  //     localStorage.setItem("code", decodedDataParam);
  //     e.setValue(decodedDataParam);
  //   }css

  //   var editCodeBtn = document.getElementById("edit-code-btn");
  //   var hideOnShared = document.getElementById("hide-on-shared");

  //   editCodeBtn.classList.remove("hidden!");
  //   hideOnShared.style.display = "none";
  // } else {
  //   // monacoEditor.setValue(localStorage.getItem("code") || "");
  // }

  // monaco.editor.defineTheme("jnscode-dark", theme);
  // monaco.editor.setTheme("jnscode-dark");

  // monaco.editor.setTheme("vs-dark");

  renderPreview();
});

const configWithLang = (lang) => ({
  automaticLayout: true,
  cursorBlinking: "smooth",
  smoothScrolling: true,
  fontSize: 13,
  theme: "vs-dark",
  minimap: { enabled: false },
  tabSize: 2,
  language: lang,
});

const e = {
  html: null,
  css: null,
  js: null,
};

let activeEditor;

const template = () => `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${e.css.getValue()}
      </style>
  </head>
  <body>
    ${e.html.getValue()}
    <script>
      ${e.js.getValue()}
    </script>
  </body>
  </html>
`;

function renderPreview() {
  if (!elPreview) return;

  const editorVal = activeEditor.getValue();
  code.set(activeEditor, editorVal);

  const url = URL.createObjectURL(
    new Blob([template()], { type: "text/html" })
  );

  elPreview.setAttribute("src", url);

  window.previousURL ? URL.revokeObjectURL(window.previousURL) : null;
  window.previousURL = url;
  elTitle.textContent = extractTitle(editorVal);
}

/////////////
// sharing //
/////////////

const dataParam = new URL(window.location.href).searchParams.get("c");

let decodedDataParam;

if (dataParam !== null && dataParam.trim() !== "") {
  try {
    const deflated = Uint8Array.from(
      atob(padBase64(dataParam).replace(/\~/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const inflated = fflate.inflateSync(deflated);
    const decompressed = fflate.strFromU8(inflated);
    decodedDataParam = decompressed;
  } catch (err) {
    toast.error("Code parameter malformed: " + err);
    decodedDataParam = "";
  }
}

export function share(mode) {
  let newData = activeEditor.getValue().trim();

  const compressed = fflate.strToU8(newData);

  const deflated = fflate.deflateSync(compressed);
  const base64Compressed = btoa(String.fromCharCode.apply(null, deflated))
    .replace(/=/g, "")
    .replace(/\+/g, "~")
    .replace(/\//g, "_");

  if (base64Compressed.length > 2048) {
    toast.error(
      `Code too long! max length: 2048, your length: ${base64Compressed.length}`
    );
    return;
  }

  const currentURL = window.location.href.split("?")[0];
  const newURL = base64Compressed
    ? `${currentURL}?c=${base64Compressed}`
    : currentURL;

  try {
    const title = extractTitle(newData());
    switch (mode) {
      case "full":
        navigator.clipboard.writeText(newURL);
        toast.success("Copied full link to clipboard");
        break;
      case "markdown":
        navigator.clipboard.writeText(`[${title}](${newURL})`);
        toast.success("Copied markdown to clipboard");
        break;
      case "html":
        navigator.clipboard.writeText(`<a href="${newURL}">${title}</a>`);
        toast.success("Copied HTML to clipboard");
        break;
      default:
        break;
    }
  } catch (err) {
    toast.error("Failed to copy to clipboard " + err);
    throw new Error(err);
  }
}

////////////////////
// event handlers //
////////////////////

window.onkeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "Enter")) {
    e.preventDefault();
    renderPreview();
  }
};

for (const elRunBtn of elRunBtns) {
  elRunBtn.onclick = renderPreview;
}

for (const elShareBtn of elShareBtns) {
  elShareBtn.onclick = () => {
    share(elShareBtn.dataset.shareAs);
  };
}

elEditCodeBtn.onclick = () => {
  code.set(activeEditor.getValue());
  location.href = location.href.split("?")[0];
};

elClearBtn.onclick = () => {
  localStorage.setItem("code", "");
  activeEditor.setValue("");
  renderPreview();
  toast.success("Cleared code");
};
