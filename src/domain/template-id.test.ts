/**
 * Tests for reading a template ID from text.
 */
import { describe, expect, it } from "vitest";
import { parseTemplateId } from "./template-id";

describe("parseTemplateId", () => {
  it("accepts a whole number above zero", () => {
    expect(parseTemplateId("1")).toBe(1);
    expect(parseTemplateId("42")).toBe(42);
    expect(parseTemplateId("2147483647")).toBe(2147483647);
  });

  it("rejects anything that is not a valid ID", () => {
    const badValues = ["0", "-1", "1.5", "abc", "", " 7", "12abc", "007", "2147483648", null];
    for (const value of badValues) {
      expect(parseTemplateId(value)).toBeNull();
    }
  });
});
