/**
 * Vera's rules for changing a template. There is no AI here: the message is checked
 * for keywords, and a fixed block of text is inserted.
 *
 * - The first rule whose keyword is in the message is used. Only that one rule is tried.
 * - A rule means "make sure this section exists". If the section is already in the text,
 *   or the heading it goes before is missing, nothing changes.
 * - When nothing changes, the text comes back exactly as it was given.
 */

interface Rule {
  // The word to look for in the message, in any letter case.
  keyword: string;
  // The heading line of the section this rule adds.
  sectionHeading: string;
  // The lines to insert, starting with the section heading.
  block: string[];
  // The new section goes immediately before this heading line.
  insertBefore: string;
  reply: string;
}

// Order matters: the first matching rule wins.
const rules: Rule[] = [
  {
    keyword: "allergies",
    sectionHeading: "Allergies:",
    block: ["Allergies:", "[Allergies and reactions] (One per line, with the reaction.)"],
    insertBefore: "Medications:",
    reply: "Done. Added an Allergies section.",
  },
  {
    keyword: "medication",
    sectionHeading: "Medication Reconciliation:",
    block: [
      "Medication Reconciliation:",
      "[Changes to medicines made today] (Started, stopped or changed, with the reason.)",
    ],
    insertBefore: "Objective:",
    reply: "Done. Added a Medication Reconciliation section.",
  },
];

export const nothingToChangeReply = "Nothing to change.";

export interface RequestOutcome {
  // True only when the text is different from what was given.
  changed: boolean;
  content: string;
  reply: string;
}

// A heading matches a whole line, ignoring spaces around it and letter case.
function findHeadingLine(lines: string[], heading: string): number {
  const wanted = heading.toLowerCase();
  return lines.findIndex((line) => line.trim().toLowerCase() === wanted);
}

export function applyRequest(content: string, message: string): RequestOutcome {
  const unchanged: RequestOutcome = { changed: false, content, reply: nothingToChangeReply };

  const lowerMessage = message.toLowerCase();
  const rule = rules.find((candidate) => lowerMessage.includes(candidate.keyword));
  if (!rule) return unchanged;

  const lines = content.split("\n");
  const sectionAlreadyThere = findHeadingLine(lines, rule.sectionHeading) !== -1;
  if (sectionAlreadyThere) return unchanged;

  const insertAt = findHeadingLine(lines, rule.insertBefore);
  if (insertAt === -1) return unchanged;

  // The block, then one empty line, so the next section stays separated.
  const newLines = [...lines.slice(0, insertAt), ...rule.block, "", ...lines.slice(insertAt)];
  return { changed: true, content: newLines.join("\n"), reply: rule.reply };
}
