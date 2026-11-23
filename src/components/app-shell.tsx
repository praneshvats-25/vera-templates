/**
 * The frame every screen sits in: grey background, a placeholder sidebar, and the page panel.
 * The sidebar is decoration only. The design asks for it to be drawn but not to work.
 */
import type { ReactNode } from "react";

interface AppShellProps {
  // The library panel is off-white. Template screens are white.
  tone: "library" | "template";
  children: ReactNode;
}

const panelTone = {
  library: "bg-grey-50",
  template: "bg-white",
};

// Widths of the grey placeholder bars, top to bottom.
const navBarWidths = ["w-10", "w-14", "w-16", "w-16"];
const listGroups = [
  ["w-36", "w-28", "w-32", "w-24"],
  ["w-28", "w-20"],
];

export function AppShell({ tone, children }: AppShellProps) {
  return (
    <div className="flex h-screen min-w-frame bg-grey-100">
      <aside aria-hidden className="flex w-sidebar shrink-0 flex-col gap-6 px-4 pt-5 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-full bg-grey-200" />
          <div className="flex flex-col gap-1.5">
            <div className="h-2.5 w-20 rounded-full bg-grey-200" />
            <div className="h-2 w-14 rounded-full bg-grey-200" />
          </div>
        </div>

        <div className="h-8 w-40 rounded-full bg-grey-200" />

        <div className="flex flex-col gap-5">
          {navBarWidths.map((width, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div className="size-4 rounded bg-grey-200" />
              <div className={`h-2 rounded-full bg-grey-200 ${width}`} />
            </div>
          ))}
        </div>

        {listGroups.map((widths, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-4">
            <div className="flex justify-between">
              <div className="h-1.5 w-12 rounded-full bg-grey-200" />
              <div className="h-1.5 w-10 rounded-full bg-grey-200" />
            </div>
            {widths.map((width, index) => (
              <div key={index} className={`h-2 rounded-full bg-grey-200 ${width}`} />
            ))}
          </div>
        ))}

        <div className="mt-auto flex flex-col gap-4">
          <div className="h-10 rounded-2xl bg-grey-200" />
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-grey-200" />
            <div className="h-2 w-16 rounded-full bg-grey-200" />
          </div>
        </div>
      </aside>

      <main
        className={`my-2 mr-2 min-w-0 flex-1 overflow-hidden rounded-2xl shadow-page ${panelTone[tone]}`}
      >
        {children}
      </main>
    </div>
  );
}
