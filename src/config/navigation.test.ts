import { describe, expect, it } from "vitest";
import { backofficeNavigation, findNavigationItem, isNavigationItemActive } from "./navigation";

describe("navigation config", () => {
  it("has unique ids and hrefs", () => {
    const ids = backofficeNavigation.map((item) => item.id);
    const hrefs = backofficeNavigation.map((item) => item.href);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("matches exact and nested paths", () => {
    expect(findNavigationItem("/dashboard")?.id).toBe("dashboard");
    expect(findNavigationItem("/dashboard/detalhe")?.id).toBe("dashboard");
  });

  it("does not match paths that only share a prefix", () => {
    expect(findNavigationItem("/dashboards")).toBeUndefined();
  });

  it("marks only the current item as active", () => {
    const [dashboard] = backofficeNavigation;
    if (!dashboard) throw new Error("navigation must not be empty");
    expect(isNavigationItemActive(dashboard, "/dashboard")).toBe(true);
    expect(isNavigationItemActive(dashboard, "/outra")).toBe(false);
  });
});
