import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { findAccessibilityViolations } from "@/test/axe";
import type { ControlledDocument } from "../../domain/document";
import { DocumentPagination } from "../DocumentPagination/DocumentPagination";
import { DocumentTable } from "./DocumentTable";

vi.mock("next/navigation", () => ({ usePathname: () => "/documentos-institucionais" }));
vi.mock("../../actions", () => ({
  changeDocumentStatusAction: vi.fn(),
  deleteDocumentAction: vi.fn(),
}));

const withToaster = (ui: ReactElement) => render(<ToasterProvider>{ui}</ToasterProvider>);

const documents: ControlledDocument[] = [
  {
    id: "1",
    category: "institutional",
    code: "RI-001",
    title: "Regimento interno",
    revision: "02",
    status: "active",
    fileName: "regimento.pdf",
    fileSize: 120_000,
    updatedAt: new Date("2026-10-20T15:30:00Z"),
  },
];

describe("DocumentTable", () => {
  it("renders an accessible, captioned table", async () => {
    const { container } = withToaster(
      <DocumentTable documents={documents} caption="Documentos — Institucionais" />,
    );

    const table = screen.getByRole("table", { name: "Documentos — Institucionais" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual(["Código", "Título", "Revisão", "Situação", "Atualizado em", "Arquivo", "Ações"]);
    expect(within(table).getByRole("cell", { name: "Regimento interno" })).toBeInTheDocument();
    expect(within(table).getByText("Vigente")).toBeInTheDocument();
    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it("formats dates in the Brazilian time zone, independent of the runtime", () => {
    withToaster(<DocumentTable documents={documents} caption="Documentos" />);
    const time = screen.getByText("20/10/2026, 12:30");
    expect(time).toHaveAttribute("datetime", "2026-10-20T15:30:00.000Z");
  });
});

describe("DocumentPagination", () => {
  it("links to adjacent pages and disables unavailable directions", async () => {
    const { container } = render(<DocumentPagination page={1} pageCount={3} total={60} />);

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Próxima página" })).toHaveAttribute(
      "href",
      "/documentos-institucionais?page=2",
    );
    expect(await findAccessibilityViolations(container)).toEqual([]);
  });
});
