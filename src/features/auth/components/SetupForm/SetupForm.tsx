"use client";

import { Button } from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/forms/TextField";
import { Turnstile } from "@/components/shared/Turnstile/Turnstile";
import { createInitialOwnerAction } from "@/features/users/actions";
import { type InitialSetupInput, initialSetupSchema } from "@/features/users/schemas/initialSetup";
import { PASSWORD_MIN_LENGTH } from "../../schemas/password";
import { AuthFormFeedback, AuthFormHeader } from "../AuthForm/AuthFormHeader";
import { FormActions, FormStack } from "../AuthForm/styles";

/** Primeiro acesso: cria o administrador principal e segue para o login. */
export function SetupForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const { control, handleSubmit, formState } = useForm<InitialSetupInput>({
    resolver: zodResolver(initialSetupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await createInitialOwnerAction({ ...values, turnstileToken: captchaToken });
    if (!result.ok) {
      setError(result.error);
      setCaptchaReset((value) => value + 1);
      return;
    }
    router.replace("/login?conta=criada");
  });

  return (
    <FormStack onSubmit={onSubmit} noValidate aria-label="Criar conta do administrador">
      <AuthFormHeader
        title="Criar conta"
        description="Primeiro acesso: esta conta será o administrador principal do backoffice."
      />
      {error ? <AuthFormFeedback intent="danger" message={error} /> : null}
      <TextField control={control} name="name" label="Nome" autoComplete="name" autoFocus />
      <TextField control={control} name="email" label="E-mail" type="email" autoComplete="email" />
      <TextField
        control={control}
        name="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        helperText={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
        revealable
      />
      <TextField
        control={control}
        name="confirmPassword"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        revealable
      />
      <Turnstile siteKey={turnstileSiteKey} onToken={setCaptchaToken} resetKey={captchaReset} />
      <FormActions>
        <Button
          type="submit"
          intent="primary"
          size="large"
          fill
          text="Criar conta"
          loading={formState.isSubmitting}
          disabled={!captchaToken}
        />
      </FormActions>
    </FormStack>
  );
}
