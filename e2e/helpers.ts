/**
 * Small helpers shared by the browser tests, so each step is written once.
 */
import { expect, type Page } from "@playwright/test";

export function templateText(page: Page) {
  return page.getByRole("region", { name: "Template text" });
}

export function unpublishedBadge(page: Page) {
  return page.getByText("Unpublished changes", { exact: true });
}

export function messageBox(page: Page) {
  return page.getByRole("textbox", { name: "Message to Vera" });
}

/** Types a request for Vera and presses the send button. */
export async function askVera(page: Page, message: string) {
  await messageBox(page).fill(message);
  await page.getByRole("button", { name: "Send" }).click();
}

/** Opens Vera's original SOAP Note from the library. */
export async function openVeraSoapNote(page: Page) {
  await page.goto("/");
  // Vera's card starts with "SOAP Note". The user's copies start with "My".
  await page.getByRole("link", { name: /^SOAP Note/ }).click();
  await expect(page.getByRole("heading", { name: "SOAP Note", exact: true })).toBeVisible();
}

/** Clicks "Edit a copy" on the open original and returns the new copy's address. */
export async function editACopy(page: Page): Promise<string> {
  const originalUrl = page.url();
  await page.getByRole("button", { name: "Edit a copy" }).click();
  await expect(page).not.toHaveURL(originalUrl);
  await expect(page.getByRole("heading", { name: /^My SOAP Note/ })).toBeVisible();
  return new URL(page.url()).pathname;
}
