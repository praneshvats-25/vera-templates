/**
 * Splits one line of template text into pieces, so each piece can be styled.
 * It never changes the text: joining the pieces gives back the exact line.
 *
 * - A line ending in a colon is a heading.
 * - [Square brackets] are fields Vera fills in.
 * - (Round brackets) are instructions for Vera.
 * - "Quotes" are words copied exactly.
 */
export type LinePieceKind = "heading" | "field" | "instruction" | "quote" | "text";

export interface LinePiece {
  kind: LinePieceKind;
  text: string;
}

// Matches [a field], (an instruction), "a quote" or “a quote”.
const markedPiece = /(\[[^\]]*\]|\([^)]*\)|"[^"]*"|“[^”]*”)/;

export function isHeadingLine(line: string): boolean {
  return line.trimEnd().endsWith(":");
}

function kindOf(text: string): LinePieceKind {
  if (text.startsWith("[") && text.endsWith("]")) return "field";
  if (text.startsWith("(") && text.endsWith(")")) return "instruction";
  if (text.startsWith('"') && text.endsWith('"') && text.length > 1) return "quote";
  if (text.startsWith("“") && text.endsWith("”")) return "quote";
  return "text";
}

export function parseTemplateLine(line: string): LinePiece[] {
  if (isHeadingLine(line)) return [{ kind: "heading", text: line }];

  return line
    .split(markedPiece)
    .filter((text) => text !== "")
    .map((text) => ({ kind: kindOf(text), text }));
}
