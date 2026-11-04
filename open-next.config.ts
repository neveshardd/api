import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Sem cache incremental (R2/KV): todas as rotas do backoffice são privadas e dinâmicas,
 * portanto não há respostas que possam ser compartilhadas com segurança.
 */
export default defineCloudflareConfig({});
