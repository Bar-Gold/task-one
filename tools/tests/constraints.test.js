/**
 * The brief's hard limits — the things that fail the submission outright —
 * plus the accessibility floor a "professional" grade implies.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { doc, html, css, ROOT, exists, htmlAssetRefs, cssAssetRefs, fontCssRefs } from "./helpers.js";

/** Every file shipped as part of the site, ignoring tooling and git. */
const siteFiles = (dir = ROOT, acc = []) => {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "tools", "dist"].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) siteFiles(full, acc);
    else acc.push(relative(ROOT, full).replaceAll("\\", "/"));
  }
  return acc;
};

describe("מגבלות — אסור להשתמש ב-JavaScript", () => {
  test("no <script> element anywhere in the document", () => {
    assert.equal(doc.querySelectorAll("script").length, 0);
  });

  test("no inline event handler attributes", () => {
    const handlers = [...html.matchAll(/\s(on[a-z]+)\s*=/gi)].map((m) => m[1]);
    assert.deepEqual(handlers, [], `found inline handlers: ${handlers.join(", ")}`);
  });

  test("no javascript: URLs", () => {
    assert.doesNotMatch(html, /javascript:/i);
  });

  test("no .js or .mjs file ships with the site", () => {
    const scripts = siteFiles().filter((f) => /\.(js|mjs|cjs|ts)$/.test(f));
    assert.deepEqual(scripts, [], `the site must ship no JavaScript, found: ${scripts.join(", ")}`);
  });

  test("no <noscript>, because nothing depends on script in the first place", () => {
    assert.equal(doc.querySelectorAll("noscript").length, 0);
  });
});

describe("מגבלות — HTML ו-CSS בלבד", () => {
  test("the theme switch is driven by CSS selectors, not a script", () => {
    assert.match(css, /#theme-toggle:checked/, "the :checked state must do the work");
  });

  test("every asset referenced from the HTML exists on disk", () => {
    for (const ref of htmlAssetRefs()) {
      assert.ok(exists(ref), `index.html references a missing file: ${ref}`);
    }
  });

  test("every asset referenced from a stylesheet exists on disk", () => {
    for (const { file, ref, path } of cssAssetRefs()) {
      assert.ok(exists(path), `${file} references a missing file: ${ref}`);
    }
    for (const { ref, path } of fontCssRefs()) {
      assert.ok(exists(path), `fonts.css references a missing font: ${ref}`);
    }
  });

  test("nothing is loaded from a third-party origin", () => {
    // A CDN font or script would break the page offline from the ZIP, and it
    // is the usual way a "no JavaScript" page smuggles JavaScript back in.
    // Navigation links to GitHub and LinkedIn are required by the brief; it
    // is sub-resources - stylesheets, fonts, images - that must be local.
    const external = doc.querySelectorAll("link, img, source, iframe, object, embed")
      .flatMap((el) => [el.getAttribute("src"), el.getAttribute("href")])
      .filter((v) => v && /^https?:/.test(v));
    assert.deepEqual(external, [], `sub-resources must be local, found: ${external.join(", ")}`);
    const cssExternal = [...css.matchAll(/url\(\s*['"]?(https?:[^'")]+)/g)].map((m) => m[1]);
    assert.deepEqual(cssExternal, [], `stylesheets must not fetch remote assets: ${cssExternal.join(", ")}`);
    assert.doesNotMatch(css, /@import/, "@import would serialise a remote fetch");
  });
});

describe("נגישות — the accessibility floor", () => {
  test("every image has an alt attribute", () => {
    for (const img of doc.querySelectorAll("img")) {
      assert.ok(img.getAttribute("alt") !== undefined && img.getAttribute("alt") !== null,
        `<img src="${img.getAttribute("src")}"> is missing alt`);
    }
  });

  test("every link has a discernible name", () => {
    for (const a of doc.querySelectorAll("a")) {
      const name = (a.text ?? "").trim() || a.getAttribute("aria-label") || a.getAttribute("title");
      assert.ok(name, `<a href="${a.getAttribute("href")}"> has no accessible name`);
    }
  });

  test("links opening a new tab carry rel=noopener", () => {
    for (const a of doc.querySelectorAll("a")) {
      if (a.getAttribute("target") !== "_blank") continue;
      assert.match(a.getAttribute("rel") ?? "", /noopener/,
        `<a href="${a.getAttribute("href")}"> opens a new tab without rel=noopener`);
    }
  });

  test("a skip link is the first focusable element", () => {
    const skip = doc.querySelector(".skip-link");
    assert.ok(skip, "a skip link must exist");
    const target = skip.getAttribute("href").slice(1);
    assert.ok(doc.querySelector(`#${target}`), `the skip link points at a missing #${target}`);
  });

  test("decorative SVG icons are hidden from assistive technology", () => {
    for (const svg of doc.querySelectorAll("svg")) {
      const parent = svg.parentNode;
      const hidden = svg.getAttribute("aria-hidden") === "true" ||
        parent?.getAttribute("aria-hidden") === "true" ||
        parent?.parentNode?.getAttribute("aria-hidden") === "true";
      assert.ok(hidden, "every decorative svg must be aria-hidden, directly or via an ancestor");
    }
  });

  test("focus is never removed without a replacement", () => {
    assert.doesNotMatch(css, /outline:\s*(none|0)\s*;(?![^}]*outline)/,
      "outline may only be removed where another focus indicator replaces it");
    assert.match(css, /:focus-visible/, "a visible focus indicator must be defined");
  });

  test("reduced motion is respected", () => {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  test("interactive controls meet the 44px touch target floor", () => {
    assert.match(css, /\.btn\s*\{[^}]*min-height:\s*2\.75rem/,
      "buttons must be at least 44px tall");
  });
});
