/* ============================================================
   Day 4 – Theme Preferences Form
   Core concepts: ES6+ Destructuring · Spread · Rest
   + Object Reference gotcha (shallow vs deep copy)
   ============================================================ */

"use strict";

// ─────────────────────────────────────────────────────────────
// 1.  DEFAULT SETTINGS
//     This is the "source of truth". User overrides get merged
//     on top with the spread operator, never mutating this obj.
// ─────────────────────────────────────────────────────────────
const defaultSettings = {
  colorScheme: "ocean",
  fontFamily:  "inter",
  fontSize:    16,
  layout:      "comfortable",
  animations:  true,
  highContrast: false,
  reducedMotion: false,
  // Nested object — used to demonstrate the shallow-copy gotcha
  advanced: {
    borderRadius: 12,
    shadowLevel:  "medium",
  },
};

// ─────────────────────────────────────────────────────────────
// 2.  COLOUR MAP  (colorScheme → CSS custom-property value)
// ─────────────────────────────────────────────────────────────
const ACCENT_MAP = {
  ocean:    "#0ea5e9",
  forest:   "#22c55e",
  sunset:   "#f97316",
  midnight: "#8b5cf6",
  rose:     "#f43f5e",
};

const FONT_MAP = {
  inter:   "'Inter', system-ui, sans-serif",
  serif:   "Georgia, 'Times New Roman', serif",
  mono:    "'Courier New', Cascadia Code, monospace",
  poppins: "'Trebuchet MS', Verdana, sans-serif",
};

// ─────────────────────────────────────────────────────────────
// 3.  READ FORM → returns a plain user-choices object
//     Uses DESTRUCTURING when pulling values out of the form
// ─────────────────────────────────────────────────────────────
function readFormValues(form) {
  const data = new FormData(form);

  // Array destructuring to pull the first match from getAll()
  const [colorScheme = "ocean"]    = data.getAll("colorScheme");
  const [fontFamily  = "inter"]    = data.getAll("fontFamily");
  const [layout      = "comfortable"] = data.getAll("layout");

  // Number coercion via + unary
  const fontSize = +data.get("fontSize");

  // Checkbox fields — FormData only includes them when checked
  const animations    = data.has("animations");
  const highContrast  = data.has("highContrast");
  const reducedMotion = data.has("reducedMotion");

  // Object shorthand (ES6) — variable name === key name
  return { colorScheme, fontFamily, fontSize, layout,
           animations, highContrast, reducedMotion };
}

// ─────────────────────────────────────────────────────────────
// 4.  MERGE WITH SPREAD
//     Creates a brand-new object; defaultSettings is untouched.
//     User choices sit to the right → they win on conflicts.
// ─────────────────────────────────────────────────────────────
function mergeSettings(userChoices) {
  // SPREAD: { ...defaults, ...overrides }
  // Note: `advanced` is still the SAME object reference (shallow!)
  return { ...defaultSettings, ...userChoices };
}

// ─────────────────────────────────────────────────────────────
// 5.  APPLY THEME TO THE DOM
//     Uses destructuring in the parameter itself
// ─────────────────────────────────────────────────────────────
function applyTheme({ colorScheme, fontFamily, fontSize,
                      layout, animations, highContrast }) {
  const root = document.documentElement;

  // Update CSS custom property for accent colour
  root.style.setProperty("--accent", ACCENT_MAP[colorScheme] ?? ACCENT_MAP.ocean);

  // Update accent-dark (a 20%-darker shade via quick hsl tweak)
  root.style.setProperty("--accent-dark", shadeColor(ACCENT_MAP[colorScheme], -20));

  // Update accent-muted
  root.style.setProperty(
    "--accent-muted",
    hexToRgba(ACCENT_MAP[colorScheme], 0.15)
  );

  // Font
  const previewCard = document.getElementById("preview-card");
  previewCard.style.fontFamily = FONT_MAP[fontFamily] ?? FONT_MAP.inter;

  // Font size
  document.getElementById("preview-body").style.fontSize = fontSize + "px";
  document.getElementById("preview-heading").style.fontSize = (fontSize * 1.4).toFixed(1) + "px";

  // Layout → padding tweak on preview card
  const paddingMap = { comfortable: "1.5rem", compact: "0.75rem", wide: "2.5rem" };
  previewCard.style.padding = paddingMap[layout] ?? "1.5rem";

  // High contrast
  if (highContrast) {
    root.style.setProperty("--text", "#ffffff");
    root.style.setProperty("--text-muted", "#d1d5db");
  } else {
    root.style.setProperty("--text", "#e2e8f0");
    root.style.setProperty("--text-muted", "#94a3b8");
  }

  // Animations — disable transitions if reducedMotion is on
  root.style.setProperty("--speed", animations ? "0.25s" : "0s");
}

// ─────────────────────────────────────────────────────────────
// 6.  REST PARAMETER demo helper
//     Accepts a primary setting + any number of extra tags
// ─────────────────────────────────────────────────────────────
function applyWithTags(primary, ...tags) {  // ← REST
  // `tags` is automatically an Array of whatever extra args were passed
  console.log("Primary setting:", primary);
  console.log("Extra tags (rest):", tags);
  return { ...primary, _tags: tags };       // ← SPREAD
}

// ─────────────────────────────────────────────────────────────
// 7.  SYNTAX HIGHLIGHTER (tiny, no deps)
//     Colours our code-block <pre> elements
// ─────────────────────────────────────────────────────────────
function highlight(code) {
  // Order matters — more-specific patterns first
  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // comments
    .replace(/(\/\/.*)/g, '<span class="cm">$1</span>')
    // keywords
    .replace(/\b(const|let|var|function|return|new|if|else|true|false|null|undefined)\b/g,
             '<span class="kw">$1</span>')
    // spread / rest
    .replace(/(\.\.\.[a-zA-Z_$][a-zA-Z0-9_$]*)/g, '<span class="op">$1</span>')
    // strings
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
             '<span class="str">$1</span>')
    // numbers
    .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="num">$1</span>')
    // function names
    .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="fn">$1</span>');
}

// ─────────────────────────────────────────────────────────────
// 8.  CODE SNIPPETS for the Concept Explorer tabs
// ─────────────────────────────────────────────────────────────
const SNIPPETS = {
  spread: `
// ── SPREAD: merging settings objects ──────────────────────
const defaultSettings = {
  colorScheme: "ocean",
  fontFamily:  "inter",
  fontSize:    16,
  layout:      "comfortable",
  animations:  true,
};

const userChoices = {
  colorScheme: "sunset",   // overrides default
  fontSize:    20,          // overrides default
};

// Spread creates a NEW object — defaults are untouched
const merged = { ...defaultSettings, ...userChoices };
// Result:
// {
//   colorScheme: "sunset",       ← from userChoices
//   fontFamily:  "inter",        ← kept from defaults
//   fontSize:    20,             ← from userChoices
//   layout:      "comfortable",  ← kept from defaults
//   animations:  true,           ← kept from defaults
// }

// Spread also works with arrays:
const tags   = ["dark", "modern"];
const extras = ["responsive"];
const all    = [...tags, ...extras];
// → ["dark", "modern", "responsive"]
`.trim(),

  destructure: `
// ── DESTRUCTURING: unpacking objects and arrays ────────────

// Object destructuring — names must match keys
const { colorScheme, fontSize, layout } = mergedSettings;

// Rename while destructuring
const { fontFamily: font } = mergedSettings;

// Default value (used if key is missing / undefined)
const { animations = true } = userChoices;

// Nested destructuring
const { advanced: { borderRadius, shadowLevel } } = mergedSettings;

// Array destructuring — position-based
const colors = ["ocean", "forest", "sunset"];
const [first, second] = colors;
// first  → "ocean"
// second → "forest"

// Skip elements
const [,, third] = colors;
// third → "sunset"

// Destructure in function parameters (used in applyTheme):
function applyTheme({ colorScheme, fontFamily, fontSize }) {
  document.documentElement.style
    .setProperty("--accent", ACCENT_MAP[colorScheme]);
  // ...
}
`.trim(),

  rest: `
// ── REST: collecting remaining items ──────────────────────

// REST in function parameters — must be LAST
function applyWithTags(primary, ...tags) {
  console.log("Primary:", primary);
  console.log("Tags (rest):", tags);   // always an Array
  return { ...primary, _tags: tags };
}

applyWithTags({ color: "sunset" }, "bold", "rounded", "glass");
// Primary: { color: "sunset" }
// Tags:    ["bold", "rounded", "glass"]

// REST in object destructuring — "everything else"
const { colorScheme, fontSize, ...rest } = mergedSettings;
// colorScheme → "ocean"
// fontSize    → 16
// rest        → { fontFamily, layout, animations, ... }

// REST in array destructuring
const [head, ...tail] = ["ocean", "forest", "sunset", "rose"];
// head → "ocean"
// tail → ["forest", "sunset", "rose"]
`.trim(),

  refs: `
// ── SHALLOW COPY GOTCHA ────────────────────────────────────
// Spread is SHALLOW — nested objects are still shared.

const defaultSettings = {
  colorScheme: "ocean",
  advanced: {           // ← nested object
    borderRadius: 12,
    shadowLevel:  "medium",
  },
};

// Create a "copy" with spread
const copy = { ...defaultSettings };

// Top-level primitive: safe — a new value is created
copy.colorScheme = "sunset";
console.log(defaultSettings.colorScheme); // "ocean" ✅

// Nested object: DANGER — both point to THE SAME object!
copy.advanced.borderRadius = 999;
console.log(defaultSettings.advanced.borderRadius); // 999 ⚠️

// ── HOW TO FIX ────────────────────────────────────────────
// Option A: Spread each nested level manually
const deepCopy = {
  ...defaultSettings,
  advanced: { ...defaultSettings.advanced },
};

// Option B: JSON round-trip (loses functions/Dates/undefined)
const jsonCopy = JSON.parse(JSON.stringify(defaultSettings));

// Option C: structuredClone (modern, handles most types)
const structCopy = structuredClone(defaultSettings);
`.trim(),
};

// ─────────────────────────────────────────────────────────────
// 9.  POPULATE CODE BLOCKS
// ─────────────────────────────────────────────────────────────
function populateCodeBlocks() {
  document.getElementById("spread-code").innerHTML      = highlight(SNIPPETS.spread);
  document.getElementById("destructure-code").innerHTML = highlight(SNIPPETS.destructure);
  document.getElementById("rest-code").innerHTML        = highlight(SNIPPETS.rest);
  document.getElementById("refs-code").innerHTML        = highlight(SNIPPETS.refs);
}

// ─────────────────────────────────────────────────────────────
// 10.  REFERENCE DEMO — step-by-step animated walkthrough
// ─────────────────────────────────────────────────────────────
function runReferenceDemo() {
  const stepsEl = document.getElementById("demo-steps");
  stepsEl.innerHTML = "";

  // Reset the original to a known state
  defaultSettings.advanced.borderRadius = 12;

  const steps = [
    { cls: "step-info", text: `defaultSettings.advanced.borderRadius → ${defaultSettings.advanced.borderRadius}` },
    { cls: "step-info", text: `copy = { ...defaultSettings }  ← spread creates shallow copy` },
    {
      cls: "step-ok",
      text: (() => {
        const copy = { ...defaultSettings };
        copy.colorScheme = "sunset";
        return `copy.colorScheme = "sunset"  →  original still "${defaultSettings.colorScheme}" ✅`;
      })(),
    },
    {
      cls: "step-err",
      text: (() => {
        const copy = { ...defaultSettings };
        copy.advanced.borderRadius = 999;   // mutates the shared nested object!
        return `copy.advanced.borderRadius = 999  →  original now ${defaultSettings.advanced.borderRadius} ⚠️ MUTATED!`;
      })(),
    },
    { cls: "step-warn", text: "Both copy.advanced and defaultSettings.advanced point to the SAME object in memory." },
    {
      cls: "step-ok",
      text: (() => {
        // Fix: reset, then deep spread
        defaultSettings.advanced.borderRadius = 12;
        const deepCopy = { ...defaultSettings, advanced: { ...defaultSettings.advanced } };
        deepCopy.advanced.borderRadius = 999;
        return `With deepCopy = { ...defaults, advanced: { ...defaults.advanced } }  →  original safe: ${defaultSettings.advanced.borderRadius} ✅`;
      })(),
    },
    {
      cls: "step-ok",
      text: (() => {
        defaultSettings.advanced.borderRadius = 12; // restore
        const sc = structuredClone(defaultSettings);
        sc.advanced.borderRadius = 999;
        return `structuredClone()  →  original safe: ${defaultSettings.advanced.borderRadius} ✅`;
      })(),
    },
  ];

  // Reveal steps one-by-one
  steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.className = step.cls;
    li.textContent = step.text;
    stepsEl.appendChild(li);
    setTimeout(() => li.classList.add("visible"), i * 500 + 100);
  });
}

// ─────────────────────────────────────────────────────────────
// 11.  RENDER MERGED SETTINGS AS FORMATTED JSON
// ─────────────────────────────────────────────────────────────
function renderMergedOutput(mergedObj) {
  const el = document.getElementById("merged-output");
  const json = JSON.stringify(mergedObj, null, 2);

  // Minimal JSON colouring
  const coloured = json
    .replace(/(".*?")\s*:/g, '<span class="str">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="val">$1</span>')
    .replace(/:\s*(\d+)/g, ': <span class="num">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="kw">$1</span>');

  el.innerHTML = coloured;
  el.style.color = "inherit";
}

// ─────────────────────────────────────────────────────────────
// 12.  COLOUR UTILITY HELPERS
// ─────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

function shadeColor(hex, percent) {
  const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  const clamp = v => Math.min(255, Math.max(0, v));
  const adj = v => clamp(Math.round(v + (v * percent) / 100));
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`;
}

// ─────────────────────────────────────────────────────────────
// 13.  INIT — wire everything up
// ─────────────────────────────────────────────────────────────
(function init() {
  populateCodeBlocks();

  const form     = document.getElementById("theme-form");
  const applyBtn = document.getElementById("applyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const fontSizeSlider = document.getElementById("fontSize");
  const fontSizeLabel  = document.getElementById("fontSizeLabel");

  // ── Live font-size label ────────────────────────────────
  fontSizeSlider.addEventListener("input", () => {
    fontSizeLabel.textContent = fontSizeSlider.value + "px";
  });

  // ── Apply button ────────────────────────────────────────
  applyBtn.addEventListener("click", () => {
    const userChoices = readFormValues(form);     // destructuring inside ↑
    const merged      = mergeSettings(userChoices); // spread inside ↑
    applyTheme(merged);                            // destructuring inside ↑
    renderMergedOutput(merged);

    // Also demo the rest helper (logged to console for students)
    const withTags = applyWithTags(userChoices, "user-applied", "day-4");
    console.log("applyWithTags result:", withTags);
  });

  // ── Reset button ────────────────────────────────────────
  resetBtn.addEventListener("click", () => {
    // Destructure defaults to reset the form
    const {
      colorScheme, fontFamily, fontSize,
      layout, animations, highContrast, reducedMotion
    } = defaultSettings;

    // Reset radios
    form.querySelector(`[name=colorScheme][value="${colorScheme}"]`).checked = true;
    form.querySelector(`[name=fontFamily][value="${fontFamily}"]`).checked   = true;
    form.querySelector(`[name=layout][value="${layout}"]`).checked           = true;

    // Reset slider
    fontSizeSlider.value   = fontSize;
    fontSizeLabel.textContent = fontSize + "px";

    // Reset checkboxes
    form.querySelector("[name=animations]").checked    = animations;
    form.querySelector("[name=highContrast]").checked  = highContrast;
    form.querySelector("[name=reducedMotion]").checked = reducedMotion;

    // Spread defaults onto DOM
    applyTheme({ ...defaultSettings });
    renderMergedOutput({ ...defaultSettings });
  });

  // ── Concept tabs ────────────────────────────────────────
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Deactivate all
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(p => p.classList.add("hidden"));

      // Activate clicked
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
    });
  });

  // ── Reference demo button ───────────────────────────────
  document.getElementById("runRefDemo").addEventListener("click", runReferenceDemo);

  // ── Boot: apply defaults immediately ────────────────────
  applyTheme({ ...defaultSettings });           // spread
  renderMergedOutput({ ...defaultSettings });
})();
