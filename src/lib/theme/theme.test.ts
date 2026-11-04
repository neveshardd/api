import { Classes } from "@blueprintjs/core";
import { describe, expect, it } from "vitest";
import { BLUEPRINT_DARK_CLASS, oppositeTheme } from "./theme";

describe("theme", () => {
  it("usa a mesma classe de tema escuro do Blueprint", () => {
    expect(BLUEPRINT_DARK_CLASS).toBe(Classes.DARK);
  });

  it("alterna entre claro e escuro", () => {
    expect(oppositeTheme("light")).toBe("dark");
    expect(oppositeTheme("dark")).toBe("light");
  });
});
