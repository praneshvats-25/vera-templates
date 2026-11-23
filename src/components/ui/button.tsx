/**
 * Button in the three looks from the design kit: primary, secondary and ghost.
 * `buttonClasses` gives the same look to a link.
 */
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-grey-900 text-white disabled:bg-primary-disabled",
  secondary: "border border-navy-8 bg-secondary text-grey-900 disabled:text-grey-400",
  ghost: "text-grey-900 hover:bg-secondary disabled:text-grey-400 disabled:hover:bg-transparent",
};

export function buttonClasses(variant: ButtonVariant): string {
  return `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-ui whitespace-nowrap ${variantClasses[variant]}`;
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant)} {...props} />;
}
