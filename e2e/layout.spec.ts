/**
 * Browser test for a laptop-sized window, 1280 wide.
 * The design is drawn at 1440, which the other tests use. On a narrower laptop the main
 * buttons must still be on screen without scrolling sideways.
 */
import { expect, type Page, test } from "@playwright/test";
import { askVera, editACopy, openVeraSoapNote } from "./helpers";

test.use({ viewport: { width: 1280, height: 800 } });

// True when the page is wider than the window, so part of it is cut off.
async function scrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

test("the main actions stay on screen in a 1280-wide window", async ({ page }) => {
  // Library: all four cards of the first row are fully visible.
  await page.goto("/");
  const cards = page.getByRole("link").filter({ hasText: "All specialties" });
  await expect(cards.nth(3)).toBeInViewport({ ratio: 1 });
  expect(await scrollsSideways(page)).toBe(false);

  // Vera's original: "Edit a copy" is fully visible.
  await openVeraSoapNote(page);
  await expect(page.getByRole("button", { name: "Edit a copy" })).toBeInViewport({ ratio: 1 });
  expect(await scrollsSideways(page)).toBe(false);

  // A copy with an unpublished change: every version control is fully visible.
  await editACopy(page);
  await askVera(page, "add allergies");
  await expect(page.getByText("Unpublished changes", { exact: true })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Discard changes" })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Publish changes" })).toBeInViewport({ ratio: 1 });
  expect(await scrollsSideways(page)).toBe(false);
});
