/**
 * Browser test for the main flow in the brief, from the library to a discarded change.
 * It checks the "Unpublished changes" badge at every step, so a broken Publish or a broken
 * edit cannot pass by accident.
 */
import { expect, type Page, test } from "@playwright/test";
import {
  askVera,
  copyTitle,
  editACopy,
  openVeraSoapNote,
  templateText,
  unpublishedBadge,
} from "./helpers";

const allergiesHeading = "Allergies:";
const medicationHeading = "Medication Reconciliation:";

// Library cards that belong to the user say "You".
function copyCards(page: Page) {
  return page.getByRole("link").filter({ has: page.getByText("You", { exact: true }) });
}

test("copy a template, change it, publish, discard, and keep copies separate", async ({ page }) => {
  await page.goto("/");
  const copiesBefore = await copyCards(page).count();

  // One click on "Edit a copy" opens a new copy. Nothing is unpublished yet.
  await openVeraSoapNote(page);
  const firstCopyPath = await editACopy(page);
  await expect(unpublishedBadge(page)).toHaveCount(0);
  await expect(templateText(page)).not.toContainText(allergiesHeading);

  // Adding Allergies changes the text and makes it unpublished.
  await askVera(page, "add allergies");
  await expect(page.getByText("Done. Added an Allergies section.")).toBeVisible();
  await expect(templateText(page)).toContainText(allergiesHeading);
  await expect(templateText(page)).toContainText(
    "[Allergies and reactions] (One per line, with the reaction.)",
  );
  await expect(unpublishedBadge(page)).toBeVisible();

  // Undo removes it, Redo brings it back.
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(templateText(page)).not.toContainText(allergiesHeading);
  await expect(unpublishedBadge(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(templateText(page)).toContainText(allergiesHeading);
  await expect(unpublishedBadge(page)).toBeVisible();

  // Publish clears the badge.
  await page.getByRole("button", { name: "Publish changes" }).click();
  await expect(unpublishedBadge(page)).toHaveCount(0);

  // Adding Medication Reconciliation shows up and is unpublished.
  await askVera(page, "add medication");
  await expect(page.getByText("Done. Added a Medication Reconciliation section.")).toBeVisible();
  await expect(templateText(page)).toContainText(medicationHeading);
  await expect(unpublishedBadge(page)).toBeVisible();

  // Discard returns to the published version, and that survives a reload.
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(templateText(page)).not.toContainText(medicationHeading);
  await page.reload();
  await expect(templateText(page)).toContainText(allergiesHeading);
  await expect(templateText(page)).not.toContainText(medicationHeading);
  await expect(unpublishedBadge(page)).toHaveCount(0);

  // The library has exactly one more copy. Reopening it from there shows the same state.
  await page.goto("/");
  await expect(copyCards(page)).toHaveCount(copiesBefore + 1);
  await page.locator(`a[href="${firstCopyPath}"]`).click();
  await expect(copyTitle(page)).toBeVisible();
  await expect(templateText(page)).toContainText(allergiesHeading);
  await expect(templateText(page)).not.toContainText(medicationHeading);
  await expect(unpublishedBadge(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish changes" })).toBeVisible();

  // Vera's original was never changed.
  await openVeraSoapNote(page);
  await expect(templateText(page)).not.toContainText(allergiesHeading);
  await expect(templateText(page)).not.toContainText(medicationHeading);

  // A second copy starts clean: published version 1, with nothing to undo or redo.
  const secondCopyPath = await editACopy(page);
  expect(secondCopyPath).not.toBe(firstCopyPath);
  await expect(templateText(page)).not.toContainText(allergiesHeading);
  await expect(templateText(page)).not.toContainText(medicationHeading);
  await expect(unpublishedBadge(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Redo", exact: true })).toBeDisabled();

  // Only the first copy was changed.
  await page.goto(firstCopyPath);
  await expect(templateText(page)).toContainText(allergiesHeading);
  await expect(templateText(page)).not.toContainText(medicationHeading);
});
