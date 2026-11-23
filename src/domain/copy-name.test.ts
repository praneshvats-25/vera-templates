/**
 * Tests for naming a new copy.
 */
import { describe, expect, it } from "vitest";
import { copyName } from "./copy-name";

describe("copyName", () => {
  it('names the first copy "My" plus the original name', () => {
    expect(copyName("SOAP Note", 0)).toBe("My SOAP Note");
  });

  it("numbers later copies, starting at 2", () => {
    expect(copyName("SOAP Note", 1)).toBe("My SOAP Note (2)");
    expect(copyName("SOAP Note", 2)).toBe("My SOAP Note (3)");
  });

  it("works for any original name", () => {
    expect(copyName("Visit Summary for the Patient", 0)).toBe("My Visit Summary for the Patient");
  });
});
