import "server-only";

import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/lib/database/client";
import type {
  ControlledDocument,
  DocumentPage,
  DocumentRepository,
  NewDocument,
  StoredDocument,
} from "../domain/document";
import type { DocumentCategory } from "../domain/documentCategory";
import type { DocumentStatus } from "../domain/documentStatus";
import { documents } from "./schema";

/** Colunas expostas à aplicação (sem a chave do arquivo). */
const publicColumns = {
  id: documents.id,
  category: documents.category,
  code: documents.code,
  title: documents.title,
  revision: documents.revision,
  status: documents.status,
  fileName: documents.fileName,
  fileSize: documents.fileSize,
  updatedAt: documents.updatedAt,
};

const storedColumns = { ...publicColumns, fileKey: documents.fileKey };

export class D1DocumentRepository implements DocumentRepository {
  constructor(private readonly db: Database) {}

  async listByCategory({
    category,
    limit,
    offset,
  }: Parameters<DocumentRepository["listByCategory"]>[0]): Promise<DocumentPage> {
    const where = eq(documents.category, category);

    const [items, total] = await Promise.all([
      this.db
        .select(publicColumns)
        .from(documents)
        .where(where)
        .orderBy(desc(documents.updatedAt))
        .limit(limit)
        .offset(offset),
      this.db.$count(documents, where),
    ]);

    return { items, total };
  }

  async listActiveByCategory(category: DocumentCategory): Promise<ControlledDocument[]> {
    return this.db
      .select(publicColumns)
      .from(documents)
      .where(and(eq(documents.category, category), eq(documents.status, "active")))
      .orderBy(documents.code);
  }

  async findById(id: string): Promise<StoredDocument | null> {
    const [row] = await this.db.select(storedColumns).from(documents).where(eq(documents.id, id));
    return row ?? null;
  }

  async create(document: NewDocument): Promise<ControlledDocument> {
    const now = new Date();
    const [row] = await this.db
      .insert(documents)
      .values({ id: crypto.randomUUID(), ...document, createdAt: now, updatedAt: now })
      .returning(publicColumns);
    if (!row) throw new Error("Falha ao criar documento.");
    return row;
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<boolean> {
    const updated = await this.db
      .update(documents)
      .set({ status, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning({ id: documents.id });
    return updated.length > 0;
  }

  async delete(id: string): Promise<StoredDocument | null> {
    const [row] = await this.db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning(storedColumns);
    return row ?? null;
  }
}
