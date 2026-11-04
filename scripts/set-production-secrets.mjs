/**
 * Grava os segredos de produção do Worker `agage-backoffice` na Cloudflare (conta do wrangler.jsonc).
 *
 * - R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY e RESEND_API_KEY: copiados do `.dev.vars`.
 * - BETTER_AUTH_SECRET: gerado na hora (sessões de produção independentes das de desenvolvimento).
 * - TURNSTILE_SECRET_KEY: passado como argumento (`--turnstile-file caminho.json`, resposta da API
 *   de criação do widget) ou lido da variável de ambiente TURNSTILE_SECRET_KEY.
 *
 * Os valores nunca são impressos; o arquivo temporário é apagado mesmo em caso de erro.
 * Uso: node scripts/set-production-secrets.mjs --turnstile-file <arquivo.json>
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const devVars = Object.fromEntries(
  readFileSync(".dev.vars", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
    }),
);

const fileFlag = process.argv.indexOf("--turnstile-file");
const turnstileSecret =
  fileFlag > 0
    ? JSON.parse(readFileSync(process.argv[fileFlag + 1], "utf8")).result?.secret
    : process.env.TURNSTILE_SECRET_KEY;

// Opcionais: sem chaves do R2 o painel funciona, só o envio de arquivos fica desligado; sem a do
// Resend, os e-mails não são enviados. Só entram se estiverem preenchidas no `.dev.vars`.
const optional = Object.fromEntries(
  ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "RESEND_API_KEY"]
    .filter((key) => devVars[key]?.trim())
    .map((key) => [key, devVars[key]]),
);

const secrets = {
  BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
  TURNSTILE_SECRET_KEY: turnstileSecret,
  ...optional,
};

const missing = Object.entries(secrets)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length > 0) {
  console.error(`Faltando: ${missing.join(", ")}`);
  process.exit(1);
}

const file = join(tmpdir(), `agage-secrets-${process.pid}.json`);
try {
  writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 });
  execFileSync("npx", ["wrangler", "secret", "bulk", file], { stdio: "inherit", shell: true });
  console.log(`\nSegredos gravados: ${Object.keys(secrets).join(", ")}`);
} finally {
  rmSync(file, { force: true });
}
