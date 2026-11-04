"use client";

import { Button } from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/forms/TextField";
import { Turnstile } from "@/components/shared/Turnstile/Turnstile";
import { acceptInvitationAction } from "@/features/users/actions";
import {
  type NewPasswordInput,
  newPasswordSchema,
  PASSWORD_MIN_LENGTH,
} from "../../schemas/password";
import { AuthFormFeedback, AuthFormHeader } from "../AuthForm/AuthFormHeader";
import { FormActions, FormStack } from "../AuthForm/styles";

interface AcceptInvitationFormProps {
  readonly token: string;
  readonly email: string;
  readonly turnstileSiteKey: string;
}

export function AcceptInvitationForm({
  token,
  email,
  turnstileSiteKey,
}: AcceptInvitationFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const { control, handleSubmit, formState } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const response = await acceptInvitationAction({
      token,
      ...values,
      turnstileToken: captchaToken,
    });
    if (!response.ok) {
      setError(response.error);
      setCaptchaReset((value) => value + 1);
      return;
    }
    router.replace("/login?convite=aceito");
  });

  return (
    <FormStack onSubmit={onSubmit} noValidate aria-label="Criar senha">
      <AuthFormHeader title="Criar senha" description={`Acesso para ${email}.`} />
      {error ? <AuthFormFeedback intent="danger" message={error} /> : null}
      {/* Campo oculto para gerenciadores de senha associarem a credencial ao e-mail. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <TextField
        control={control}
        name="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        helperText={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
        autoFocus
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
          text="Criar senha"
          loading={formState.isSubmitting}
          disabled={!captchaToken}
        />
      </FormActions>
    </FormStack>
  );
}
