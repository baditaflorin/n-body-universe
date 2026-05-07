import { expect, test } from "@playwright/test";

test("loads the static simulator and initializes REBOUND", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "N-Body Universe" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Star" })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/n-body-universe",
  );
  await expect(page.getByRole("link", { name: "PayPal" })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita",
  );

  await page.getByRole("button", { name: /Start REBOUND/i }).click();
  await expect(page.getByText(/REBOUND WASM initialized/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Bodies/i).first()).toBeVisible();
});
