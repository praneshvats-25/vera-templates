/**
 * Tests for splitting a template line into styled pieces.
 */
import { describe, expect, it } from "vitest";
import { starterTemplates } from "../db/starter-templates";
import { parseTemplateLine } from "./parse-template-line";

describe("parseTemplateLine", () => {
  it("treats a line ending in a colon as one heading", () => {
    expect(parseTemplateLine("Presenting Complaint:")).toEqual([
      { kind: "heading", text: "Presenting Complaint:" },
    ]);
  });

  it("splits a field and an instruction, keeping the space between them", () => {
    expect(
      parseTemplateLine("[Current medications] (One per line, with dose and frequency.)"),
    ).toEqual([
      { kind: "field", text: "[Current medications]" },
      { kind: "text", text: " " },
      { kind: "instruction", text: "(One per line, with dose and frequency.)" },
    ]);
  });

  it("marks a quoted sentence as exact wording", () => {
    expect(parseTemplateLine('"Return if your symptoms get worse."')).toEqual([
      { kind: "quote", text: '"Return if your symptoms get worse."' },
    ]);
  });

  it("leaves ordinary words as plain text", () => {
    expect(parseTemplateLine("Seen today in clinic")).toEqual([
      { kind: "text", text: "Seen today in clinic" },
    ]);
  });

  it("leaves a bracket that never closes as plain text", () => {
    expect(parseTemplateLine("[Vital signs (if measured")).toEqual([
      { kind: "text", text: "[Vital signs (if measured" },
    ]);
  });

  it("returns no pieces for an empty line", () => {
    expect(parseTemplateLine("")).toEqual([]);
  });

  it("never changes the text: the pieces of every starter template line join back to the line", () => {
    for (const template of starterTemplates) {
      for (const line of template.content.split("\n")) {
        const joined = parseTemplateLine(line)
          .map((piece) => piece.text)
          .join("");
        expect(joined).toBe(line);
      }
    }
  });
});
