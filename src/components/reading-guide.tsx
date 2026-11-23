/**
 * The "How Vera reads this" panel beside a template.
 * It explains the four marks used in template text, each with a small example.
 */
import { CaretUpIcon } from "@phosphor-icons/react/dist/ssr";

interface GuideRow {
  term: string;
  meaning: string;
  example: string;
  // Colour of the example, matching how that mark looks in the template.
  exampleClass: string;
}

const guideRows: GuideRow[] = [
  {
    term: "Headings",
    meaning: "A line ending in a colon",
    example: "History:",
    exampleClass: "text-grey-900",
  },
  {
    term: "[Square brackets]",
    meaning: "What Vera fills in",
    example: "[reason for the visit]",
    exampleClass: "text-brand-500",
  },
  {
    term: "(Round brackets)",
    meaning: "How to write it or when to leave it out",
    example: "(Only if examined.)",
    exampleClass: "text-grey-400",
  },
  {
    term: '"Quotes"',
    meaning: "Words copied exactly",
    example: '"Seen with a chaperone."',
    exampleClass: "text-grey-900",
  },
];

export function ReadingGuide() {
  return (
    <aside className="flex w-guide shrink-0 flex-col gap-1 rounded-2xl border border-grey-200 bg-white p-3">
      <div className="flex items-center justify-between px-2 py-1.5">
        <h2 className="text-ui">How Vera reads this</h2>
        <CaretUpIcon size={16} aria-hidden />
      </div>
      <dl className="flex flex-col divide-y divide-grey-200">
        {guideRows.map((row) => (
          <div key={row.term} className="flex flex-col px-2 py-2.5">
            <dt className="text-guide font-medium">{row.term}</dt>
            <dd className="text-guide text-grey-500">{row.meaning}</dd>
            <dd className={`font-mono text-small ${row.exampleClass}`}>{row.example}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
