import "server-only";

import { Resend } from "resend";
import { isProduction, type ServerEnv } from "@/config/env";
import { logger } from "@/lib/logging/logger";

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}

class ResendMailer implements Mailer {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({ from: this.from, ...message });
    if (error) {
      logger.error("email.send_failed", { provider: "resend", reason: error.name });
      throw new Error("Não foi possível enviar o e-mail.");
    }
  }
}

/**
 * Somente em desenvolvimento e sem RESEND_API_KEY: escreve a mensagem no terminal do servidor
 * para permitir testar convites localmente. Nunca é usado em produção.
 */
class DevelopmentConsoleMailer implements Mailer {
  async send(message: EmailMessage): Promise<void> {
    console.info(
      `\n[email:dev] Para: ${message.to}\n[email:dev] Assunto: ${message.subject}\n${message.text}\n`,
    );
  }
}

export function createMailer(env: ServerEnv): Mailer {
  if (env.RESEND_API_KEY) return new ResendMailer(env.RESEND_API_KEY, env.EMAIL_FROM);
  if (!isProduction()) return new DevelopmentConsoleMailer();
  throw new Error("RESEND_API_KEY não configurada.");
}
