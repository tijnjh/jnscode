import { theme } from "./theme.js";
import { toast } from "./toast.js";

const editCodebtn = document.getElementById("edit-code-btn");
const clearBtn = document.getElementById("clear-btn");
const dataParam = new URLSearchParams(window.location.search).get("c");

let hasParam = false;
let decodedDataParam;

function padBase64(input) {
  var segmentLength = 4;
  var stringLength = input.length;
  var diff = stringLength % segmentLength;

  if (!diff) {
    return input;
  }

  var padLength = segmentLength - diff;
  var paddedStringLength = stringLength + padLength;
  var buffer = input;

  while (padLength--) {
    buffer += "=";
  }
  return buffer.toString();
}

if (dataParam !== null && dataParam.trim() !== "") {
  hasParam = true;

  const deflated = Uint8Array.from(
    atob(padBase64(dataParam).replace(/\~/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );
  const inflated = fflate.inflateSync(deflated);
  const decompressed = fflate.strFromU8(inflated);

  decodedDataParam = decompressed;
}

require.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.26.1/min/vs" },
});
require(["vs/editor/editor.main"], () => {
  createEditor();
});

function createEditor() {
  window.editor = monaco.editor.create(document.getElementById("editor"), {
    language: "html",
    automaticLayout: true,
    cursorBlinking: "smooth",
    smoothScrolling: true,
    fontSize: 13,
    minimap: { enabled: false },
    tabSize: 2,
  });

  emmetMonaco.emmetHTML(monaco);

  if (dataParam !== null && dataParam.trim() !== "") {
    window.editor.updateOptions({ readOnly: true });
    localStorage.setItem("code", decodedDataParam);
    window.editor.setValue(decodedDataParam);

    var editCodeBtn = document.getElementById("edit-code-btn");
    var hideOnShared = document.getElementById("hide-on-shared");

    editCodeBtn.style.display = "flex";
    hideOnShared.style.display = "none";
  } else {
    window.editor.setValue(localStorage.getItem("code") || "");
  }

  monaco.editor.defineTheme("jnscode-dark", theme);
  monaco.editor.setTheme("jnscode-dark");

  renderPreview();
}

window.onkeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "Enter")) {
    e.preventDefault();
    renderPreview();
  }
};

for (const runBtn of [...document.getElementsByClassName("run-btn")]) {
  runBtn.onclick = renderPreview;
}

for (const runBtn of [...document.getElementsByClassName("share-btn")]) {
  runBtn.onclick = () => share(runBtn.dataset.shareAs);
}

function renderPreview() {
  localStorage.setItem("code", window.editor.getValue());

  const url = URL.createObjectURL(
    new Blob([window.editor.getValue()], { type: "text/html" })
  );
  const previewElement = document.getElementById("preview");

  if (previewElement) {
    previewElement.setAttribute("src", url);
  }

  window.previousURL ? URL.revokeObjectURL(window.previousURL) : null;
  window.previousURL = url;
  document.getElementsByTagName("title")[0].innerHTML = `${extractTitle()}`;
}

function extractTitle() {
  const regex = window.editor.getValue().match(/<title>(.*?)<\/title>/);
  return regex && regex[1] ? regex[1] : "untitled";
}

export function share(mode) {
  let newData = window.editor.getValue().trim();

  const compressed = fflate.strToU8(newData);

  const deflated = fflate.deflateSync(compressed);
  const base64Compressed = btoa(String.fromCharCode.apply(null, deflated))
    .replace(/=/g, "")
    .replace(/\+/g, "~")
    .replace(/\//g, "_");

  if (base64Compressed.length > 2048) {
    alert(
      `Code too long! max length: 2048, your length: ${base64Compressed.length}`
    );
    return;
  }

  const currentURL = window.location.href.split("?")[0];
  const newURL = base64Compressed
    ? `${currentURL}?c=${base64Compressed}`
    : currentURL;

  try {
    if (mode === "full") {
      navigator.clipboard.writeText(newURL);
      toast.success("Copied full link to clipboard");
    } else if (mode === "markdown") {
      navigator.clipboard.writeText(`[${extractTitle()}](${newURL})`);
      toast.success("Copied markdown to clipboard");
    } else if (mode === "html") {
      navigator.clipboard.writeText(
        `<a href="${newURL}">${extractTitle()}</a>`
      );
      toast.success("Copied HTML to clipboard");
    }
  } catch (err) {
    toast.error("Failed to copy to clipboard");
  }
}

editCodebtn.onclick = () => {
  localStorage.setItem("code", window.editor.getValue());
  location.href = location.href.split("?")[0];
};

clearBtn.onclick = () => {
  localStorage.setItem("code", "");
  window.editor.setValue("");
  renderPreview();
  alert("Cleared code");
};
