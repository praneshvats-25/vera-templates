/**
 * A round button that shows only an icon.
 * `label` names the button for screen readers, since it has no visible words.
 */
import type { ComponentProps } from "react";

type IconButtonVariant = "ghost" | "solid";

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: "text-grey-900 hover:bg-secondary disabled:text-grey-300 disabled:hover:bg-transparent",
  solid: "bg-grey-900 text-white disabled:bg-primary-disabled",
};

interface IconButtonProps extends ComponentProps<"button"> {
  label: string;
  variant?: IconButtonVariant;
}

export function IconButton({
  label,
  variant = "ghost",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${variantClasses[variant]}`}
      {...props}
    />
  );
}
