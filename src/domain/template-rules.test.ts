/**
 * Tests for Vera's rules. Each test compares the whole resulting text and the exact reply,
 * so both the wording and the place of the inserted section are proven.
 */
import { describe, expect, it } from "vitest";
import { starterTemplates } from "../db/starter-templates";
import { applyRequest } from "./template-rules";

const soapNote = starterTemplates.find((template) => template.name === "SOAP Note")?.content ?? "";

const soapNoteWithAllergies = `Subjective:

Presenting Complaint:
[Primary reason for the visit, in the patient's own words] (A brief phrase. Only if stated.)

History of Presenting Complaint:
[Narrative of the presenting problem] (Prose paragraphs, in clinical order.)

Allergies:
[Allergies and reactions] (One per line, with the reaction.)

Medications:
[Current medications] (One per line, with dose and frequency.)

Objective:

Vital Signs:
[Vital signs] (Only if measured.)

Physical Examination:
[Examination findings] (Only if examined.)

Assessment and Plan:
[Each problem with its plan] (One problem per paragraph, most important first.)
"Return if your symptoms get worse."`;

const soapNoteWithMedicationReconciliation = `Subjective:

Presenting Complaint:
[Primary reason for the visit, in the patient's own words] (A brief phrase. Only if stated.)

History of Presenting Complaint:
[Narrative of the presenting problem] (Prose paragraphs, in clinical order.)

Medications:
[Current medications] (One per line, with dose and frequency.)

Medication Reconciliation:
[Changes to medicines made today] (Started, stopped or changed, with the reason.)

Objective:

Vital Signs:
[Vital signs] (Only if measured.)

Physical Examination:
[Examination findings] (Only if examined.)

Assessment and Plan:
[Each problem with its plan] (One problem per paragraph, most important first.)
"Return if your symptoms get worse."`;

const soapNoteWithBoth = `Subjective:

Presenting Complaint:
[Primary reason for the visit, in the patient's own words] (A brief phrase. Only if stated.)

History of Presenting Complaint:
[Narrative of the presenting problem] (Prose paragraphs, in clinical order.)

Allergies:
[Allergies and reactions] (One per line, with the reaction.)

Medications:
[Current medications] (One per line, with dose and frequency.)

Medication Reconciliation:
[Changes to medicines made today] (Started, stopped or changed, with the reason.)

Objective:

Vital Signs:
[Vital signs] (Only if measured.)

Physical Examination:
[Examination findings] (Only if examined.)

Assessment and Plan:
[Each problem with its plan] (One problem per paragraph, most important first.)
"Return if your symptoms get worse."`;

const nothingChanged = (content: string) => ({
  changed: false,
  content,
  reply: "Nothing to change.",
});

describe("applyRequest", () => {
  it("starts from the brief's full SOAP Note", () => {
    expect(soapNote.startsWith("Subjective:")).toBe(true);
    expect(soapNote.endsWith('"Return if your symptoms get worse."')).toBe(true);
  });

  it('"add allergies" inserts the Allergies block immediately before Medications:', () => {
    expect(applyRequest(soapNote, "add allergies")).toEqual({
      changed: true,
      content: soapNoteWithAllergies,
      reply: "Done. Added an Allergies section.",
    });
  });

  it('"add medication" inserts Medication Reconciliation immediately before Objective:', () => {
    expect(applyRequest(soapNote, "add medication")).toEqual({
      changed: true,
      content: soapNoteWithMedicationReconciliation,
      reply: "Done. Added a Medication Reconciliation section.",
    });
  });

  it("adds both sections when asked one after the other", () => {
    const afterAllergies = applyRequest(soapNote, "add allergies").content;
    expect(applyRequest(afterAllergies, "add medication")).toEqual({
      changed: true,
      content: soapNoteWithBoth,
      reply: "Done. Added a Medication Reconciliation section.",
    });
  });

  it("ignores upper and lower case in the message", () => {
    expect(applyRequest(soapNote, "Please ADD Allergies").content).toBe(soapNoteWithAllergies);
    expect(applyRequest(soapNote, "MEDICATIONS please").content).toBe(
      soapNoteWithMedicationReconciliation,
    );
  });

  it("uses only the first matching rule when a message has both keywords", () => {
    expect(applyRequest(soapNote, "add medication and allergies")).toEqual({
      changed: true,
      content: soapNoteWithAllergies,
      reply: "Done. Added an Allergies section.",
    });
  });

  it("does not fall through to the second rule when the first one changes nothing", () => {
    expect(applyRequest(soapNoteWithAllergies, "add allergies and medication")).toEqual(
      nothingChanged(soapNoteWithAllergies),
    );
  });

  it("changes nothing for a message with no keyword, including singular 'allergy'", () => {
    expect(applyRequest(soapNote, "make it shorter")).toEqual(nothingChanged(soapNote));
    expect(applyRequest(soapNote, "add an allergy section")).toEqual(nothingChanged(soapNote));
    expect(applyRequest(soapNote, "")).toEqual(nothingChanged(soapNote));
  });

  it("changes nothing when the section is already there, so asking twice leaves one section", () => {
    expect(applyRequest(soapNoteWithAllergies, "add allergies")).toEqual(
      nothingChanged(soapNoteWithAllergies),
    );
    expect(applyRequest(soapNoteWithMedicationReconciliation, "add medication")).toEqual(
      nothingChanged(soapNoteWithMedicationReconciliation),
    );
  });

  it("finds an existing section whatever its letter case or spacing", () => {
    const text = "  ALLERGIES:  \n[something]\n\nMedications:\n[Current medications]";
    expect(applyRequest(text, "add allergies")).toEqual(nothingChanged(text));
  });

  it("changes nothing when the heading to insert before is missing", () => {
    const noMedications = "Subjective:\n\nObjective:\n[Findings]";
    expect(applyRequest(noMedications, "add allergies")).toEqual(nothingChanged(noMedications));
    const noObjective = "Subjective:\n\nMedications:\n[Current medications]";
    expect(applyRequest(noObjective, "add medication")).toEqual(nothingChanged(noObjective));
  });

  it("works again after the insertion was undone: the original text accepts the request again", () => {
    const first = applyRequest(soapNote, "add allergies");
    expect(first.changed).toBe(true);
    // Undo shows the original text again. The same request must work a second time.
    expect(applyRequest(soapNote, "add allergies")).toEqual(first);
  });
});
