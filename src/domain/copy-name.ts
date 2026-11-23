/**
 * Names a new copy of one of Vera's templates.
 * The first copy of "SOAP Note" is "My SOAP Note", the second is "My SOAP Note (2)", and so on,
 * so the cards in the library can be told apart.
 */
export function copyName(originalName: string, existingCopies: number): string {
  const firstName = `My ${originalName}`;
  if (existingCopies === 0) return firstName;
  return `${firstName} (${String(existingCopies + 1)})`;
}
