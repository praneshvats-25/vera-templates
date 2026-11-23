/**
 * Small round badge with someone's initials, as shown on the library cards.
 */
interface AvatarProps {
  initials: string;
}

export function Avatar({ initials }: AvatarProps) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-navy-8 bg-secondary text-avatar text-grey-500">
      {initials}
    </span>
  );
}
