import "server-only";

import { cache } from "react";
import { getServerEnv, type ServerEnv } from "@/config/env";
import { type Auth, createAuth } from "@/lib/auth/auth";
import { type Database, getDatabase } from "@/lib/database/client";
import { createMailer, type Mailer } from "@/lib/email/mailer";
import { createStorage } from "@/lib/storage/createStorage";
import type { ObjectStorage } from "@/lib/storage/objectStorage";

/**
 * Dependências de infraestrutura de uma requisição. Os casos de uso recebem este contexto
 * em vez de acessar bindings globais, o que permite testá-los com D1 local e fakes.
 */
export interface AppContext {
  readonly db: Database;
  readonly auth: Auth;
  readonly mailer: Mailer;
  /** Arquivos (vídeos e PDFs) no R2 via API S3. */
  readonly media: ObjectStorage;
  readonly env: ServerEnv;
}

export function buildAppContext(deps: {
  db: Database;
  env: ServerEnv;
  media?: ObjectStorage;
  mailer?: Mailer;
}): AppContext {
  return {
    db: deps.db,
    env: deps.env,
    auth: createAuth(deps.db, deps.env),
    media: deps.media ?? createStorage(deps.env),
    mailer: deps.mailer ?? createMailer(deps.env),
  };
}

/** Um contexto por requisição (React `cache` deduplica em Server Components e actions). */
export const getAppContext = cache(
  (): AppContext => buildAppContext({ db: getDatabase(), env: getServerEnv() }),
);
