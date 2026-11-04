"use client";

import { Button } from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/shared/forms/TextField";
import {
  AuthFormFeedback,
  AuthFormHeader,
} from "@/features/auth/components/AuthForm/AuthFormHeader";
import { FormActions, FormStack } from "@/features/auth/components/AuthForm/styles";
import { authClient } from "@/lib/auth/authClient";
import { getDeviceFingerprint } from "@/lib/device/fingerprint";
import { sendDeviceCodeAction, verifyDeviceCodeAction } from "../../actions";
import { SecondaryActions } from "./styles";

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Informe os 6 dígitos do código."),
});
type CodeInput = z.infer<typeof codeSchema>;
type Feedback = { intent: "success" | "danger"; message: string } | null;

export function DeviceVerificationForm({ email }: { email: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [sending, setSending] = useState(false);
  const sentOnce = useRef(false);
  const { control, handleSubmit, formState } = useForm<CodeInput>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const send = async () => {
    setSending(true);
    const result = await sendDeviceCodeAction();
    setSending(false);
    setFeedback(
      result.ok
        ? { intent: "success", message: result.message ?? "Código enviado." }
        : { intent: "danger", message: result.error },
    );
  };

  // Envia o primeiro código ao abrir a página (uma única vez, inclusive no Strict Mode).
  // biome-ignore lint/correctness/useExhaustiveDependencies: envio único ao abrir a página.
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void send();
    void getDeviceFingerprint();
  }, []);

  const onSubmit = handleSubmit(async ({ code }) => {
    setFeedback(null);
    const fingerprint = await getDeviceFingerprint();
    const result = await verifyDeviceCodeAction({ code, fingerprint });
    if (!result.ok) {
      setFeedback({ intent: "danger", message: result.error });
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  });

  const signOut = async () => {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <FormStack onSubmit={onSubmit} noValidate aria-label="Confirmar dispositivo">
      <AuthFormHeader
        title="Confirme este dispositivo"
        description={`É a primeira vez que este navegador acessa o painel. Digite o código de 6 dígitos enviado para ${email}.`}
      />
      {feedback ? <AuthFormFeedback intent={feedback.intent} message={feedback.message} /> : null}
      <TextField
        control={control}
        name="code"
        label="Código de verificação"
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={6}
        autoFocus
      />
      <FormActions>
        <Button
          type="submit"
          intent="primary"
          size="large"
          fill
          text="Confirmar"
          loading={formState.isSubmitting}
        />
      </FormActions>
      <SecondaryActions>
        <Button variant="minimal" text="Reenviar código" loading={sending} onClick={send} />
        <Button variant="minimal" text="Sair" onClick={signOut} />
      </SecondaryActions>
    </FormStack>
  );
}
