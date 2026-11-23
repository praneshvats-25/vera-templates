/**
 * The bar at the top of a template screen. Figma calls it "Top bar".
 * The link back to the library is on the left. Actions for the template go on the right.
 */
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "./ui/button";

interface TemplateToolbarProps {
  // The actions shown on the right side of the bar.
  children?: ReactNode;
}

export function TemplateToolbar({ children }: TemplateToolbarProps) {
  return (
    <div className="flex h-toolbar shrink-0 items-center gap-2 border-b border-grey-200 px-6">
      <Link href="/" className={buttonClasses("ghost")}>
        <ArrowLeftIcon size={16} aria-hidden />
        Templates
      </Link>
      <div className="flex-1" />
      {children}
    </div>
  );
}
