"use client";

/**
 * A button that submits the form it sits in.
 * It switches itself off while the form is saving, which stops a double-click
 * from sending the same request twice.
 */
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "./button";

interface SubmitButtonProps {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function SubmitButton({ variant = "primary", children }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {children}
    </Button>
  );
}
