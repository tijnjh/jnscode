export const code = {
  value: {
    h: "",
    c: "",
    j: "",
  },

  load() {
    const saved = localStorage.getItem("codeValues");
    if (saved) {
      try {
        this.value = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved code values:", e);
      }
    }
  },

  save() {
    localStorage.setItem("codeValues", JSON.stringify(this.value));
  },

  set(lang, v) {
    this.value[lang] = v;
    this.save();
  },

  get(lang) {
    return this.value[lang];
  },
};

// Load saved values on initialization
code.load();
