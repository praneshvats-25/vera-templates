/**
 * Draws template text with the design's styling.
 * The text itself is never changed. Each line is split into pieces only to colour them:
 * headings, [fields], (instructions) and "quotes".
 */
import { type LinePieceKind, parseTemplateLine } from "@/domain/parse-template-line";

interface TemplatePreviewProps {
  // The template text, exactly as saved.
  content: string;
}

const pieceClasses: Record<LinePieceKind, string> = {
  heading: "font-semibold text-grey-900",
  field: "text-brand-500",
  instruction: "text-grey-400",
  quote: "text-grey-900",
  text: "text-grey-900",
};

export function TemplatePreview({ content }: TemplatePreviewProps) {
  return (
    <div className="text-template whitespace-pre-wrap">
      {content.split("\n").map((line, lineIndex) => (
        // min-h-6 keeps an empty line as tall as a line of text.
        <p key={lineIndex} className="min-h-6">
          {parseTemplateLine(line).map((piece, pieceIndex) => (
            <span key={pieceIndex} className={pieceClasses[piece.kind]}>
              {piece.text}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
