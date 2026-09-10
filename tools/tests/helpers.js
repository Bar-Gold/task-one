import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const read = (relative) => readFileSync(join(ROOT, relative), "utf8");
export const exists = (relative) => existsSync(join(ROOT, relative));

export const html = read("index.html");
export const doc = parse(html, { comment: true });

export const cssFiles = ["css/reset.css", "css/tokens.css", "css/style.css"];
export const css = cssFiles.map(read).join("\n");

/* ------------------------------------------------------------------ colour */

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** WCAG 2.1 relative luminance. */
export const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2.1 contrast ratio between two hex colours, 1..21. */
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* ------------------------------------------------- custom property parsing */

const declarationsIn = (block) => {
  const out = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
};

/**
 * Pull one balanced `{ ... }` body out of `text`, starting at the first brace
 * at or after `from`. A regex cannot do this: tokens.css nests @media blocks.
 */
const blockAt = (text, from) => {
  const start = text.indexOf("{", from);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return { body: text.slice(start + 1, i), end: i };
    }
  }
  return null;
};

const tokensCss = read("css/tokens.css");

/** Every `:root { ... }` body that is NOT inside a prefers-color-scheme block. */
const lightRootBodies = () => {
  const bodies = [];
  const darkRanges = [];
  for (const m of tokensCss.matchAll(/@media\s*\(prefers-color-scheme:\s*dark\)/g)) {
    const block = blockAt(tokensCss, m.index);
    if (block) darkRanges.push([m.index, block.end]);
  }
  const insideDark = (i) => darkRanges.some(([s, e]) => i >= s && i <= e);
  for (const m of tokensCss.matchAll(/(^|\n)\s*:root\s*\{/g)) {
    const at = m.index + m[0].indexOf(":root");
    if (insideDark(at)) continue;
    const block = blockAt(tokensCss, at);
    if (block) bodies.push(block.body);
  }
  return bodies;
};

/** Every `:root { ... }` body that IS inside a prefers-color-scheme block. */
const darkRootBodies = () => {
  const bodies = [];
  for (const m of tokensCss.matchAll(/@media\s*\(prefers-color-scheme:\s*dark\)/g)) {
    const outer = blockAt(tokensCss, m.index);
    if (!outer) continue;
    for (const inner of outer.body.matchAll(/:root\s*\{/g)) {
      const block = blockAt(outer.body, inner.index);
      if (block) bodies.push(block.body);
    }
  }
  return bodies;
};

const merge = (bodies) =>
  bodies.reduce((acc, body) => Object.assign(acc, declarationsIn(body)), {});

/** Follow `var(--x)` chains until a literal value falls out. */
const resolveIn = (map, name, seen = new Set()) => {
  let value = map[name];
  while (value && /^var\(\s*(--[\w-]+)\s*\)$/.test(value)) {
    const next = value.match(/^var\(\s*(--[\w-]+)\s*\)$/)[1];
    if (seen.has(next)) return null;
    seen.add(next);
    value = map[next];
  }
  return value ?? null;
};

/**
 * The two live colour scales. Light is the default `:root`; dark is the same
 * `:root` re-declared inside the prefers-color-scheme query, layered on top.
 * Both inherit the theme-independent raw palette.
 */
export const themes = (() => {
  const light = merge(lightRootBodies());
  const dark = { ...light, ...merge(darkRootBodies()) };
  const resolved = (map) => {
    const out = {};
    for (const name of Object.keys(map)) {
      const value = resolveIn(map, name);
      if (value && /^#[0-9a-f]{3,8}$/i.test(value)) out[name] = value;
    }
    return out;
  };
  return { light: resolved(light), dark: resolved(dark) };
})();

/* -------------------------------------------------------------- extraction */

/** Every local (non-http, non-data) path referenced from the HTML. */
export const htmlAssetRefs = () => {
  const refs = new Set();
  for (const el of doc.querySelectorAll("[src], [href]")) {
    for (const attr of ["src", "href"]) {
      const v = el.getAttribute(attr);
      if (v && !/^(https?:|mailto:|tel:|data:|#)/.test(v)) refs.add(v.split("?")[0]);
    }
  }
  for (const el of doc.querySelectorAll("[srcset]")) {
    for (const part of el.getAttribute("srcset").split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url && !/^(https?:|data:)/.test(url)) refs.add(url);
    }
  }
  return [...refs];
};

/** Every local `url(...)` referenced from a stylesheet, paired with its file. */
export const cssAssetRefs = () =>
  cssFiles.flatMap((file) => {
    const dir = dirname(file);
    return [...read(file).matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
      .map((m) => m[1])
      .filter((u) => !/^(https?:|data:)/.test(u))
      .map((u) => ({ file, ref: u, path: join(dir, u).replaceAll("\\", "/") }));
  });

/** fonts.css lives beside its woff2 files, so its urls resolve against it. */
export const fontCssRefs = () => {
  const dir = "assets/fonts";
  return [...read("assets/fonts/fonts.css").matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
    .map((m) => ({ ref: m[1], path: `${dir}/${m[1]}` }));
};
