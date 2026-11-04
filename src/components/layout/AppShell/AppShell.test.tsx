import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/AppProviders";
import { findAccessibilityViolations } from "@/test/axe";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useServerInsertedHTML: () => {},
}));

function renderShell() {
  return render(
    <AppProviders>
      <AppShell user={{ email: "dono@agage.com.br", role: "owner" }}>
        <h1>Conteúdo</h1>
      </AppShell>
    </AppProviders>,
  );
}

describe("AppShell", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderShell();
    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it("exposes banner, navigation and main landmarks", () => {
    renderShell();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("offers a skip link targeting the main content", () => {
    renderShell();
    const skipLink = screen.getByRole("link", { name: "Pular para o conteúdo" });
    expect(skipLink).toHaveAttribute("href", `#${screen.getByRole("main").id}`);
  });

  it("marks the current page in the navigation", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByRole("link", { name: "Painel" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows the breadcrumb trail with an accessible icon-only root", () => {
    renderShell();
    const trail = screen.getByRole("navigation", { name: "Trilha de navegação" });
    expect(within(trail).getByRole("img", { name: "Início" })).toBeInTheDocument();
    expect(within(trail).getByText("Painel").closest("li")).toHaveAttribute("aria-current", "page");
  });

  it("opens the navigation drawer and reflects its state", async () => {
    const user = userEvent.setup();
    renderShell();
    const toggle = screen.getByRole("button", { name: "Abrir navegação" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("dialog", { name: "Navegação" })).toBeInTheDocument();
  });

  it("toggles the Blueprint dark theme and persists the choice", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Ativar tema escuro" }));

    expect(document.documentElement).toHaveClass("bp6-dark");
    expect(localStorage.getItem("agage:theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Ativar tema claro" })).toBeInTheDocument();
  });
});
