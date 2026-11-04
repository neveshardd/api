import { describe, expect, it, vi } from "vitest";
import type { DocumentRepository } from "../domain/document";
import { DOCUMENTS_PAGE_SIZE } from "../schemas/listDocumentsQuery";
import { listDocuments } from "./listDocuments";

function repositoryWith(total: number) {
  const listByCategory = vi.fn<DocumentRepository["listByCategory"]>(async () => ({
    items: [],
    total,
  }));
  const unused = () => Promise.reject(new Error("não usado neste teste"));
  const repository: DocumentRepository = {
    listByCategory,
    listActiveByCategory: unused,
    findById: unused,
    create: unused,
    updateStatus: unused,
    delete: unused,
  };
  return { repository, listByCategory };
}

describe("listDocuments", () => {
  it("queries the first page by default", async () => {
    const { repository, listByCategory } = repositoryWith(0);

    const result = await listDocuments(repository, "institutional", {});

    expect(listByCategory).toHaveBeenCalledWith({
      category: "institutional",
      limit: DOCUMENTS_PAGE_SIZE,
      offset: 0,
    });
    expect(result).toMatchObject({ page: 1, pageCount: 1, total: 0 });
  });

  it("translates the page number into an offset", async () => {
    const { repository, listByCategory } = repositoryWith(60);

    const result = await listDocuments(repository, "onboarding", { page: "3" });

    expect(listByCategory).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 2 * DOCUMENTS_PAGE_SIZE }),
    );
    expect(result.pageCount).toBe(Math.ceil(60 / DOCUMENTS_PAGE_SIZE));
  });

  it.each([["abc"], ["-2"], ["0"], ["1.5"], [["2", "3"]]])(
    "falls back to the first page for invalid input %j",
    async (page) => {
      const { repository, listByCategory } = repositoryWith(0);

      await listDocuments(repository, "occupational-safety", { page });

      expect(listByCategory).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    },
  );
});
