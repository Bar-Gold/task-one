/**
 * One test per requirement listed in מטלה 1, named after the requirement so a
 * failure points straight back at the clause it breaks.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { doc, html, css } from "./helpers.js";

const text = doc.structuredText ?? doc.text;

describe("דרישות מינימום — the seven mandatory content items", () => {
  test("1. שם מלא — exactly one h1, carrying the full name", () => {
    const h1s = doc.querySelectorAll("h1");
    assert.equal(h1s.length, 1, "a page must have exactly one h1");
    assert.match(h1s[0].text.trim(), /בר\s+גולדשטיין/, "the h1 must be the full name");
  });

  test("1. תפקיד / תחום התמחות — the role line is present", () => {
    assert.match(text, /DevOps Engineer/, "the role must name the specialisation");
    assert.match(text, /סטודנט למדעי המחשב/, "the role must name the field of study");
  });

  test("2. תמונת פרופיל — a profile image with meaningful alt text", () => {
    const img = doc.querySelectorAll("img").find((i) => /profile/.test(i.getAttribute("src") ?? ""));
    assert.ok(img, "a profile image must exist");
    const alt = img.getAttribute("alt") ?? "";
    assert.ok(alt.trim().length >= 10, `alt text must describe the photo, got ${JSON.stringify(alt)}`);
    assert.ok(img.getAttribute("width") && img.getAttribute("height"),
      "width and height reserve the box and prevent layout shift");
  });

  test("3. פסקה קצרה — a substantial about paragraph", () => {
    const about = doc.querySelector("#about");
    assert.ok(about, "an #about section must exist");
    const longest = Math.max(...about.querySelectorAll("p").map((p) => p.text.trim().length));
    assert.ok(longest >= 120, `the about paragraph must be substantial, longest was ${longest} chars`);
  });

  test("4. קישור לחשבון GitHub", () => {
    const link = doc.querySelectorAll("a")
      .find((a) => /^https:\/\/github\.com\/[\w-]+/.test(a.getAttribute("href") ?? ""));
    assert.ok(link, "a link to a GitHub account must exist");
  });

  test("5. קישור לפרופיל LinkedIn", () => {
    const link = doc.querySelectorAll("a")
      .find((a) => /linkedin\.com\/in\//.test(a.getAttribute("href") ?? ""));
    assert.ok(link, "a link to a LinkedIn profile must exist");
  });

  test("6. מספר טלפון — a real tel: link, not just printed digits", () => {
    const link = doc.querySelectorAll("a")
      .find((a) => (a.getAttribute("href") ?? "").startsWith("tel:"));
    assert.ok(link, "a tel: link must exist so the number is tappable on a phone");
    assert.match(link.getAttribute("href"), /^tel:\+?[\d]{7,}$/, "tel: must hold a dialable number");
  });

  test("7. כתובת דואר אלקטרוני — a real mailto: link", () => {
    const link = doc.querySelectorAll("a")
      .find((a) => (a.getAttribute("href") ?? "").startsWith("mailto:"));
    assert.ok(link, "a mailto: link must exist");
    assert.match(link.getAttribute("href"), /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  });
});

describe("דרישות טכניות — the technical requirements", () => {
  test("מצב כהה ומצב בהיר — a real, focusable toggle control", () => {
    const input = doc.querySelector("#theme-toggle");
    assert.ok(input, "the theme toggle input must exist");
    assert.equal(input.getAttribute("type"), "checkbox");
    const label = doc.querySelectorAll("label").find((l) => l.getAttribute("for") === "theme-toggle");
    assert.ok(label, "a <label for> must drive the toggle, so it is clickable and named");
    assert.ok(label.text.trim().length > 0, "the label must carry text for screen readers");
  });

  test("מצב כהה ומצב בהיר — both schemes are fully defined, not just inverted", () => {
    assert.match(css, /@media\s*\(prefers-color-scheme:\s*dark\)/,
      "the OS preference must supply the default theme");
    assert.match(css, /#theme-toggle:checked\s*~\s*\.page/,
      "the checked state must re-map the colour tokens");
    // The switch has to invert the OS default, which needs a :checked rule
    // living inside the dark media query as well as outside it.
    const darkBlocks = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\n\}/g) ?? [];
    assert.ok(darkBlocks.some((b) => b.includes("#theme-toggle:checked")),
      "the toggle must also invert when the OS itself prefers dark");
  });

  test("רספונסיביות — viewport meta plus real breakpoints", () => {
    const viewport = doc.querySelectorAll("meta").find((m) => m.getAttribute("name") === "viewport");
    assert.ok(viewport, "a viewport meta tag is required for mobile rendering");
    assert.match(viewport.getAttribute("content"), /width=device-width/);
    assert.doesNotMatch(viewport.getAttribute("content"), /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/,
      "pinch zoom must not be disabled");

    const widthQueries = css.match(/@media[^{]*\((?:min|max)-width/g) ?? [];
    assert.ok(widthQueries.length >= 3,
      `a wide range of screens needs several breakpoints, found ${widthQueries.length}`);
  });

  test("רספונסיביות — no grid track can outgrow its container", () => {
    // minmax(20rem, 1fr) overflows any viewport narrower than 20rem. The
    // min(N, 100%) form is what keeps 320px phones free of horizontal scroll.
    const bare = css.match(/minmax\(\s*\d+(?:\.\d+)?rem/g) ?? [];
    assert.deepEqual(bare, [], `every minmax must be clamped with min(...): found ${bare.join(", ")}`);
  });

  test("שימוש נכון בתגיות — semantic landmarks and ordered headings", () => {
    for (const tag of ["header", "nav", "main", "section", "footer"]) {
      assert.ok(doc.querySelector(tag), `<${tag}> must be used`);
    }
    assert.equal(doc.querySelectorAll("main").length, 1, "there must be exactly one <main>");

    const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
    assert.equal(levels[0], 1, "the first heading must be the h1");
    levels.reduce((prev, level) => {
      assert.ok(level <= prev + 1, `heading levels must not skip: h${prev} jumped to h${level}`);
      return level;
    });
  });

  test("קוד ה-CSS מופרד לקובץ חיצוני", () => {
    assert.equal(doc.querySelectorAll("style").length, 0, "no <style> element may appear in the HTML");
    assert.equal(doc.querySelectorAll("[style]").length, 0, "no style=\"\" attribute may appear in the HTML");
    const sheets = doc.querySelectorAll("link").filter((l) => l.getAttribute("rel") === "stylesheet");
    assert.ok(sheets.length > 0, "the CSS must arrive through <link rel=stylesheet>");
    for (const sheet of sheets) {
      assert.match(sheet.getAttribute("href"), /\.css$/, "every stylesheet link must point at a .css file");
    }
  });

  test("Hebrew RTL document", () => {
    assert.equal(doc.querySelector("html").getAttribute("lang"), "he");
    assert.equal(doc.querySelector("html").getAttribute("dir"), "rtl");
    const title = doc.querySelector("title");
    assert.ok(title && title.text.trim().length > 0, "the page needs a title");
  });
});
