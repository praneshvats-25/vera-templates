/**
 * Who a template belongs to, as shown on cards and pages.
 * The app has one user and no sign-in, so the user's details are fixed here.
 */
export interface TemplateAuthor {
  name: string;
  initials: string;
  specialty: string;
}

const vera: TemplateAuthor = { name: "Vera", initials: "V", specialty: "All specialties" };
const you: TemplateAuthor = { name: "You", initials: "AK", specialty: "Family medicine" };

export function templateAuthor(isOriginal: boolean): TemplateAuthor {
  return isOriginal ? vera : you;
}
