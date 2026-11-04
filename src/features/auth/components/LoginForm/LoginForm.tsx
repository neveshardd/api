"use client";

import { Button } from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/forms/TextField";
import { Turnstile } from "@/components/shared/Turnstile/Turnstile";
import { FINGERPRINT_HEADER } from "@/features/devices/domain/device";
import { authClient } from "@/lib/auth/authClient";
import { getDeviceFingerprint } from "@/lib/device/fingerprint";
import { type LoginInput, loginSchema } from "../../schemas/password";
import { AuthFormFeedback, AuthFormHeader } from "../AuthForm/AuthFormHeader";
import { FormActions, FormNotice, FormStack } from "../AuthForm/styles";

interface LoginFormProps {
  /** Mensagem exibida ao chegar (ex.: após criar a senha pelo convite). */
  readonly notice?: string;
  readonly turnstileSiteKey: string;
}

export function LoginForm({ notice, turnstileSiteKey }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email(
      { email, password },
      {
        headers: {
          "x-captcha-response": captchaToken ?? "",
          // Reconhecimento do dispositivo (junto do cookie httpOnly, verificado no servidor).
          [FINGERPRINT_HEADER]: (await getDeviceFingerprint()) ?? "",
        },
      },
    );
    if (signInError) {
      // Tokens do Turnstile são de uso único: gera um novo desafio para a próxima tentativa.
      setCaptchaReset((value) => value + 1);
      setError(
        signInError.status === 429
          ? "Muitas tentativas. Aguarde um minuto e tente novamente."
          : "E-mail ou senha inválidos.",
      );
      return;
    }
    // Dispositivos não reconhecidos são encaminhados para a confirmação por e-mail.
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <FormStack onSubmit={onSubmit} noValidate aria-label="Entrar no backoffice">
      <AuthFormHeader title="Entrar" />
      {error ? <AuthFormFeedback intent="danger" message={error} /> : null}
      {!error && notice ? <AuthFormFeedback intent="success" message={notice} /> : null}
      <TextField
        control={control}
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        autoFocus
      />
      <TextField
        control={control}
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        revealable
      />
      <Turnstile siteKey={turnstileSiteKey} onToken={setCaptchaToken} resetKey={captchaReset} />
      <FormActions>
        <Button
          type="submit"
          intent="primary"
          size="large"
          fill
          text="Entrar"
          loading={formState.isSubmitting}
          disabled={!captchaToken}
        />
      </FormActions>
      <FormNotice className="bp6-text-muted">
        Por segurança, este navegador é identificado e registrado. Acessos de dispositivos novos
        exigem confirmação por e-mail.
      </FormNotice>
    </FormStack>
  );
}
