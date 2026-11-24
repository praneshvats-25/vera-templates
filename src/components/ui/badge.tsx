/**
 * A small pill-shaped label, used for "Unpublished changes".
 */
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
}

export function Badge({ children }: BadgeProps) {
  return (
    <span className="inline-flex h-4.5 shrink-0 items-center rounded-full border border-grey-200 bg-secondary px-1.5 font-mono text-badge whitespace-nowrap text-grey-500 uppercase">
      {children}
    </span>
  );
}
