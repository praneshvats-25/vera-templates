/**
 * Shown when an address does not match any page or template.
 */
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppShell tone="template">
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <h1 className="text-template-title">We could not find that template</h1>
        <p className="text-body text-grey-500">The link may be wrong.</p>
        <Link href="/" className={buttonClasses("secondary")}>
          Back to templates
        </Link>
      </div>
    </AppShell>
  );
}
