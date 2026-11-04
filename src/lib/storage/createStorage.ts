import "server-only";

import type { ServerEnv } from "@/config/env";
import { UserFacingError } from "@/lib/errors/userFacingError";
import type { ObjectStorage } from "./objectStorage";
import { S3ObjectStorage } from "./s3ObjectStorage";

const NOT_CONFIGURED =
  "Armazenamento de arquivos não configurado: defina R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.";

/** Sem credenciais, qualquer operação de arquivo falha com mensagem clara (o resto do painel funciona). */
const unconfiguredStorage: ObjectStorage = new Proxy({} as ObjectStorage, {
  get: () => () => Promise.reject(new UserFacingError(NOT_CONFIGURED)),
});

export function createStorage(env: ServerEnv): ObjectStorage {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return unconfiguredStorage;
  return new S3ObjectStorage({
    accountId: env.R2_ACCOUNT_ID,
    bucket: env.R2_BUCKET,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });
}
