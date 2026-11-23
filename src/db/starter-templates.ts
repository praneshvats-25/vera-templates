/**
 * Vera's starter templates, in the order the library shows them.
 * The SOAP Note text is copied exactly from the brief. The others are short placeholders.
 */
import type { DocumentType } from "./schema";

export interface StarterTemplate {
  name: string;
  description: string;
  documentType: DocumentType;
  content: string;
}

const soapNote = `Subjective:

Presenting Complaint:
[Primary reason for the visit, in the patient's own words] (A brief phrase. Only if stated.)

History of Presenting Complaint:
[Narrative of the presenting problem] (Prose paragraphs, in clinical order.)

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

export const starterTemplates: StarterTemplate[] = [
  {
    name: "SOAP Note",
    description: "Note for one outpatient consultation, problem by problem",
    documentType: "clinical",
    content: soapNote,
  },
  {
    name: "History and Examination",
    description: "Full history and examination for a new patient, a consultation or an admission",
    documentType: "clinical",
    content: `Reason for Admission:
[Why the patient is being seen] (One or two sentences.)

History:
[Full history] (Prose paragraphs, in clinical order.)

Examination:
[Examination findings by system] (Only systems examined.)

Plan:
[Plan] (One item per line.)`,
  },
  {
    name: "Referral Letter",
    description: "Refers a patient to a specialist or service with a clear question",
    documentType: "clinical",
    content: `Reason for Referral:
[The question for the specialist] (One clear question.)

Background:
[Relevant history and results] (Short paragraphs.)

"Thank you for seeing this patient."`,
  },
  {
    name: "Progress Note",
    description: "Daily ward-round note for an admitted patient, problem by problem",
    documentType: "clinical",
    content: `Overnight Events:
[What changed since yesterday] (Only if something changed.)

Problems:
[Each active problem with today's plan] (One problem per paragraph.)`,
  },
  {
    name: "Emergency Department Note",
    description: "Emergency department note, from arrival to disposition, with return precautions",
    documentType: "clinical",
    content: `Presenting Complaint:
[Reason for attendance] (A brief phrase.)

Assessment:
[Findings and working diagnosis] (Prose paragraphs.)

Disposition:
[Where the patient goes next] (Home, admit or transfer.)

"Return if your symptoms get worse."`,
  },
  {
    name: "Procedure Note",
    description: "Note for one bedside or in-office procedure",
    documentType: "clinical",
    content: `Procedure:
[Name of the procedure] (As performed.)

Findings:
[What was found] (Only if relevant.)

Complications:
[Any complications] (Write "None" if there were none.)`,
  },
  {
    name: "Visit Summary for the Patient",
    description:
      "Summary of this visit for the patient: what was discussed, medicines, tests and next steps",
    documentType: "patient",
    content: `What We Discussed:
[Main points of the visit] (Plain language, short sentences.)

Your Medicines:
[Medicines and how to take them] (One per line.)

Next Steps:
[Tests, referrals and follow-up] (One per line.)`,
  },
  {
    name: "Patient Message",
    description:
      "Short message to a patient by portal, email or text: a result, a change of plan, a reminder or an answer",
    documentType: "patient",
    content: `Message:
[What the patient needs to know] (Two or three short sentences.)

What To Do:
[Any action for the patient] (Only if there is one.)`,
  },
  {
    name: "Patient Handout",
    description: "Teaching handout on a condition or treatment",
    documentType: "patient",
    content: `About This Condition:
[What it is, in plain language] (Short paragraphs.)

What You Can Do:
[Self-care steps] (One per line.)

When To Get Help:
[Warning signs] (One per line.)`,
  },
  {
    name: "Discharge Instructions",
    description:
      "What the patient does after leaving the hospital, the emergency department or a day procedure",
    documentType: "patient",
    content: `Why You Were Here:
[Reason for the stay] (One or two sentences.)

At Home:
[Care instructions] (One per line.)

Follow-up:
[Appointments and who to call] (One per line.)

"Return if your symptoms get worse."`,
  },
];
