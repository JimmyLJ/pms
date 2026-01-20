import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("应该渲染按钮文本", () => {
    render(<Button>点击我</Button>);
    expect(screen.getByRole("button", { name: "点击我" })).toBeInTheDocument();
  });

  it("应该处理点击事件", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>点击</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("禁用时不应触发点击事件", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick} disabled>
        禁用按钮
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("应该应用 variant 样式", () => {
    const { rerender } = render(<Button variant="destructive">删除</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");

    rerender(<Button variant="outline">取消</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");
  });

  it("应该应用 size 样式", () => {
    const { rerender } = render(<Button size="sm">小按钮</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-8");

    rerender(<Button size="lg">大按钮</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10");
  });

  it("应该接受自定义 className", () => {
    render(<Button className="custom-class">自定义</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("asChild 应该渲染子元素作为根", () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "链接按钮" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });
});
