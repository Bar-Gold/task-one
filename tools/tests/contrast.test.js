/**
 * Both themes must be readable, not merely different. Every foreground /
 * background pairing the stylesheet actually uses is checked against the
 * WCAG 2.1 AA ratio for its text size.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { themes, contrast } from "./helpers.js";

/* [foreground, background, minimum, where it appears] */
const PAIRS = [
  ["--fg", "--bg", 4.5, "body copy on the page"],
  ["--fg", "--bg-elev", 4.5, "card titles"],
  ["--fg", "--bg-subtle", 4.5, "text on the alternate section"],
  ["--fg-muted", "--bg", 4.5, "paragraph text"],
  ["--fg-muted", "--bg-elev", 4.5, "card body text"],
  ["--fg-muted", "--bg-subtle", 4.5, "tag labels"],
  ["--fg-subtle", "--bg", 4.5, "footer and eyebrow text"],
  ["--fg-subtle", "--bg-elev", 4.5, "contact labels"],
  ["--accent-text", "--bg", 4.5, "section kickers"],
  ["--accent-text", "--bg-elev", 4.5, "skill icons"],
  ["--accent-text", "--bg-inset", 4.5, "contact icons"],
  ["--on-accent", "--accent", 4.5, "primary button label"],
  ["--on-accent", "--accent-hover", 4.5, "primary button label while hovered"],
  ["--ring", "--bg", 3, "focus ring against the page"],
  ["--border-strong", "--bg", 1.4, "control borders"],
];

for (const scheme of ["light", "dark"]) {
  describe(`ניגודיות — ${scheme} theme`, () => {
    const tokens = themes[scheme];

    test("every colour token resolves to a real value", () => {
      const needed = new Set(PAIRS.flatMap(([a, b]) => [a, b]));
      for (const name of needed) {
        assert.ok(tokens[name], `${name} did not resolve in the ${scheme} theme`);
      }
    });

    for (const [fg, bg, min, where] of PAIRS) {
      test(`${fg} on ${bg} >= ${min}:1 (${where})`, () => {
        const ratio = contrast(tokens[fg], tokens[bg]);
        assert.ok(
          ratio >= min,
          `${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}) is ${ratio.toFixed(2)}:1, needs ${min}:1`,
        );
      });
    }
  });
}

describe("ניגודיות — the two themes are genuinely distinct", () => {
  test("the page background actually inverts", () => {
    assert.notEqual(themes.light["--bg"], themes.dark["--bg"]);
    const light = contrast(themes.light["--bg"], "#ffffff");
    const dark = contrast(themes.dark["--bg"], "#ffffff");
    assert.ok(light < 1.3, "the light theme must be light");
    assert.ok(dark > 12, "the dark theme must be genuinely dark");
  });

  test("every semantic colour token exists in both themes", () => {
    for (const name of Object.keys(themes.light)) {
      assert.ok(name in themes.dark, `${name} is missing from the dark theme`);
    }
  });
});
