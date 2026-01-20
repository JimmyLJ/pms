import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (classname utility)", () => {
  it("应该合并多个类名", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("应该处理条件类名", () => {
    const result = cn("base", true && "active", false && "disabled");
    expect(result).toBe("base active");
  });

  it("应该处理 undefined 和 null", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("应该合并 Tailwind 冲突类名", () => {
    // tailwind-merge 应该处理冲突
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("应该处理数组", () => {
    const result = cn(["class1", "class2"]);
    expect(result).toBe("class1 class2");
  });

  it("应该处理空输入", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
