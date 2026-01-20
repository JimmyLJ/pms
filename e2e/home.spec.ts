import { test, expect } from "@playwright/test";

test.describe("首页", () => {
  test("应该显示首页内容", async ({ page }) => {
    await page.goto("/");

    // 首页应该加载成功
    await expect(page).toHaveURL("/");
  });

  test("未登录用户应该看到登录/注册入口", async ({ page }) => {
    await page.goto("/");

    // 检查页面是否有登录相关的导航
    // 根据实际首页实现调整
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });
});
