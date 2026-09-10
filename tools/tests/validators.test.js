/**
 * The page and its stylesheets must pass an independent validator, not just
 * my own assertions about them.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { HtmlValidate, formatterFactory } from "html-validate";
import stylelint from "stylelint";
import { ROOT, cssFiles } from "./helpers.js";

describe("HTML תקין", () => {
  test("index.html passes html-validate with no errors", async () => {
    const validator = new HtmlValidate();
    const report = await validator.validateFile(join(ROOT, "index.html"));
    const format = formatterFactory("text");
    assert.ok(report.valid, `html-validate reported problems:\n${format(report.results)}`);
  });
});

describe("CSS תקין", () => {
  test("every stylesheet passes stylelint with no errors", async () => {
    const result = await stylelint.lint({
      files: cssFiles.map((f) => join(ROOT, f)),
      formatter: "string",
    });
    assert.equal(result.errored, false, `stylelint reported problems:\n${result.report}`);
  });
});
