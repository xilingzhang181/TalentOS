import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and displays the correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TalentOS/i);
  });

  test("displays the hero section with brand name", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("TalentOS");
  });

  test("displays the subtitle tagline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("AI 驱动的职业发展平台")).toBeVisible();
  });

  test("displays the description text", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("上传简历，获得 AI 深度分析与岗位语义匹配"),
    ).toBeVisible();
  });

  test("navigates to sign-up page when clicking the primary CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /开始分析/ }).click();
    await expect(page).toHaveURL(/sign-up/);
  });

  test("navigates to sign-in page", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("scrolls to features section when clicking 'Learn More'", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /了解更多/ }).click();
    await expect(page.locator("#features")).toBeVisible();
  });

  test("displays all three feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("AI 简历 X 光")).toBeVisible();
    await expect(page.getByText("语义岗位匹配")).toBeVisible();
    await expect(page.getByText("技能差距分析")).toBeVisible();
  });

  test("displays trust badges", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("加密传输")).toBeVisible();
    await expect(page.getByText("数据安全")).toBeVisible();
    await expect(page.getByText("隐私优先")).toBeVisible();
  });

  test("displays the footer with copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toContainText("TalentOS");
    await expect(page.locator("footer")).toContainText("All rights reserved");
  });
});

test.describe("Homepage - Responsive Layout", () => {
  test("renders properly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Hero should still be visible
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("AI 驱动的职业发展平台")).toBeVisible();

    // CTA buttons should be visible
    await expect(page.getByRole("link", { name: /开始分析/ })).toBeVisible();

    // Feature cards should stack vertically (still visible)
    await expect(page.getByText("AI 简历 X 光")).toBeVisible();
  });

  test("renders properly on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("AI 简历 X 光")).toBeVisible();
    await expect(page.getByText("语义岗位匹配")).toBeVisible();
    await expect(page.getByText("技能差距分析")).toBeVisible();
  });
});
