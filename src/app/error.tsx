"use client";

/**
 * Shown when a page fails in a way nothing else handled, instead of Next.js's bare error screen.
 * "Try again" loads the page again.
 */
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error("The page could not be shown.", error);
  }, [error]);

  return (
    <AppShell tone="template">
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <h1 className="text-template-title">Something went wrong</h1>
        <p className="text-body text-grey-500">The page could not be shown. Please try again.</p>
        <Button
          variant="secondary"
          onClick={() => {
            retry();
          }}
        >
          Try again
        </Button>
      </div>
    </AppShell>
  );
}
