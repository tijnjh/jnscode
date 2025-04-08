import * as monaco from "https://cdn.jsdelivr.net/npm/monaco-editor/+esm";
import { emmetHTML } from "https://cdn.jsdelivr.net/npm/emmet-monaco-es/+esm";

import "./lib/format.js";
import "./lib/resize-handler.js";

import { theme } from "./lib/theme.js";
import { toast } from "./lib/toast.js";
import { padBase64, extractTitle } from "./lib/utils.js";

//////////////////
// dom bindings //
//////////////////

const elEditCodeBtn = document.getElementById("edit-code-btn");
const elClearBtn = document.getElementById("clear-btn");
const elRunBtns = Array.from(document.getElementsByClassName("run-btn"));
const elShareBtns = Array.from(document.getElementsByClassName("share-btn"));

///////////////////
// monaco editor //
///////////////////

let monacoEditor;

function createEditor() {
  monacoEditor = monaco.editor.create(document.getElementById("editor"), {
    language: "html",
    automaticLayout: true,
    cursorBlinking: "smooth",
    smoothScrolling: true,
    fontSize: 13,
    minimap: { enabled: false },
    tabSize: 2,
  });

  emmetHTML(monaco);

  if (dataParam !== null && dataParam.trim() !== "") {
    monacoEditor.updateOptions({ readOnly: true });
    localStorage.setItem("code", decodedDataParam);
    monacoEditor.setValue(decodedDataParam);

    var editCodeBtn = document.getElementById("edit-code-btn");
    var hideOnShared = document.getElementById("hide-on-shared");

    editCodeBtn.classList.remove("hidden!");
    hideOnShared.style.display = "none";
  } else {
    monacoEditor.setValue(localStorage.getItem("code") || "");
  }

  monaco.editor.defineTheme("jnscode-dark", theme);
  monaco.editor.setTheme("jnscode-dark");

  renderPreview();
}

function renderPreview() {
  const code = monacoEditor.getValue();
  localStorage.setItem("code", code);

  const url = URL.createObjectURL(new Blob([code], { type: "text/html" }));
  const previewElement = document.getElementById("preview");
  if (!previewElement) return;

  previewElement.setAttribute("src", url);

  window.previousURL ? URL.revokeObjectURL(window.previousURL) : null;
  window.previousURL = url;
  document.getElementsByTagName("title")[0].innerHTML = `${extractTitle(code)}`;
}

/////////////
// sharing //
/////////////

const dataParam = new URL(window.location.href).searchParams.get("c");

// init editor after loading sharing params
createEditor();

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
  let newData = monacoEditor.getValue().trim();

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
  elShareBtn.onclick = () => share(elShareBtn.dataset.shareAs);
}

elEditCodeBtn.onclick = () => {
  localStorage.setItem("code", monacoEditor.getValue());
  location.href = location.href.split("?")[0];
};

elClearBtn.onclick = () => {
  localStorage.setItem("code", "");
  monacoEditor.setValue("");
  renderPreview();
  toast.success("Cleared code");
};
