/**
 * Browser tests for the request box under a copy.
 * Each one covers a way the box could mislead the user or lose what they typed.
 */
import { expect, test } from "@playwright/test";
import {
  askVera,
  editACopy,
  messageBox,
  openVeraSoapNote,
  templateText,
  unpublishedBadge,
} from "./helpers";

const staleMessage = "This template was changed somewhere else";

test("the box is locked while a request is saving, so nothing typed can be erased", async ({
  page,
}) => {
  await openVeraSoapNote(page);
  await editACopy(page);

  // Hold the server's answer for a moment, so the "saving" state can be checked.
  await page.route("**/templates/*", async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    await route.continue();
  });

  await askVera(page, "add allergies");

  // While saving: the request is still in the box, and the box cannot be typed in.
  await expect(messageBox(page)).toHaveValue("add allergies");
  await expect(messageBox(page)).not.toBeEditable();

  // After saving: the box is empty and can be used again.
  await expect(page.getByText("Done. Added an Allergies section.")).toBeVisible();
  await expect(messageBox(page)).toHaveValue("");
  await expect(messageBox(page)).toBeEditable();
});

test("a refused Undo does not hide the reply to the next request", async ({ page }) => {
  await openVeraSoapNote(page);
  const copyPath = await editACopy(page);
  await askVera(page, "add allergies");
  await expect(page.getByRole("button", { name: "Undo this change" })).toBeVisible();

  // Another tab publishes the same copy, so this tab is now out of date.
  const otherTab = await page.context().newPage();
  await otherTab.goto(copyPath);
  await otherTab.getByRole("button", { name: "Publish changes" }).click();
  await expect(unpublishedBadge(otherTab)).toHaveCount(0);
  await otherTab.close();

  // The Undo beside the reply is refused, and the reason is shown.
  await page.getByRole("button", { name: "Undo this change" }).click();
  await expect(page.getByText(staleMessage)).toBeVisible();
  await expect(templateText(page)).toContainText("Allergies:");

  // Without reloading, the next request works and its reply replaces the old error.
  await askVera(page, "add medication");
  await expect(page.getByText("Done. Added a Medication Reconciliation section.")).toBeVisible();
  await expect(page.getByText(staleMessage)).toHaveCount(0);
  await expect(templateText(page)).toContainText("Medication Reconciliation:");
});

test("a request that is too long gets a clear reason and stays in the box", async ({ page }) => {
  await openVeraSoapNote(page);
  await editACopy(page);

  const tooLong = "add allergies ".repeat(150);
  await askVera(page, tooLong);

  await expect(page.getByText("That request is too long.")).toBeVisible();
  await expect(messageBox(page)).toHaveValue(tooLong);
  await expect(templateText(page)).not.toContainText("Allergies:");
});
