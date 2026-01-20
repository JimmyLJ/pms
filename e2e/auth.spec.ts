import { test, expect } from "@playwright/test";

test.describe("认证流程", () => {
  test("应该显示登录页面", async ({ page }) => {
    await page.goto("/sign-in");

    // 验证页面标题
    await expect(page.locator("text=Login")).toBeVisible();

    // 验证表单元素存在
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test("应该显示注册页面", async ({ page }) => {
    await page.goto("/sign-up");

    // 验证页面标题
    await expect(page.locator("text=Create an account")).toBeVisible();

    // 验证表单元素存在
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
  });

  test("登录页面应该有注册链接", async ({ page }) => {
    await page.goto("/sign-in");

    const signUpLink = page.locator('a:has-text("Sign Up")');
    await expect(signUpLink).toBeVisible();

    await signUpLink.click();
    await expect(page).toHaveURL("/sign-up");
  });

  test("注册页面应该有登录链接", async ({ page }) => {
    await page.goto("/sign-up");

    const signInLink = page.locator('a:has-text("Sign In")');
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await expect(page).toHaveURL("/sign-in");
  });

  test("空表单提交应该不会跳转", async ({ page }) => {
    await page.goto("/sign-in");

    // 点击登录按钮（不填写任何内容）
    await page.locator('button:has-text("Login")').click();

    // 应该仍在登录页面
    await expect(page).toHaveURL("/sign-in");
  });
});
