/**
 * The words shown for each document type.
 * This is the only place these labels are written, so a patient handout can never be
 * labelled as a clinical document by mistake.
 */
import type { DocumentType } from "../db/schema";

interface DocumentTypeWords {
  // Heading of the group in the library, for example "Clinical documents".
  groupTitle: string;
  // Label for one template, for example "Clinical document".
  label: string;
}

export const documentTypeWords: Record<DocumentType, DocumentTypeWords> = {
  clinical: { groupTitle: "Clinical documents", label: "Clinical document" },
  patient: { groupTitle: "Patient documents", label: "Patient document" },
};

// The order the groups appear in the library.
export const documentTypeOrder: DocumentType[] = ["clinical", "patient"];
