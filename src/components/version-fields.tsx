/**
 * The hidden fields every form about a copy sends: which copy it is, and the version
 * pointers the page was drawn with. The server refuses a change when those pointers are
 * out of date, for example because another tab changed the copy.
 */
import type { VersionPointers } from "@/domain/version-history";

interface VersionFieldsProps {
  templateId: number;
  pointers: VersionPointers;
}

export function VersionFields({ templateId, pointers }: VersionFieldsProps) {
  return (
    <>
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="current" value={pointers.current} />
      <input type="hidden" name="published" value={pointers.published} />
      <input type="hidden" name="tip" value={pointers.tip} />
    </>
  );
}
