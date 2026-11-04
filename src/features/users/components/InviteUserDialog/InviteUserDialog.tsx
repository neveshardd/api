"use client";

import { Button, Callout, Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToaster } from "@/components/providers/ToasterProvider";
import { TextField } from "@/components/shared/forms/TextField";
import { icon } from "@/components/shared/icons/AppIcon";
import { emailSchema } from "@/features/auth/schemas/password";
import { inviteAdminAction } from "../../actions";

const inviteSchema = z.object({ email: emailSchema });
type InviteInput = z.infer<typeof inviteSchema>;

export function InviteUserDialog() {
  const { notify } = useToaster();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const close = () => {
    setIsOpen(false);
    setError(null);
    reset();
  };

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    const result = await inviteAdminAction(email);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify(result.message ?? "Convite enviado.");
    close();
  });

  return (
    <>
      <Button
        intent="primary"
        icon={icon(IconUserPlus)}
        text="Convidar usuário"
        onClick={() => setIsOpen(true)}
      />
      <Dialog isOpen={isOpen} onClose={close} title="Convidar usuário" icon={icon(IconUserPlus)}>
        <form onSubmit={onSubmit} noValidate>
          <DialogBody>
            <p>
              A pessoa receberá um e-mail com um link pessoal (válido por 72 horas) para criar a
              senha e acessar o painel.
            </p>
            {error ? (
              <Callout intent="danger" compact role="alert">
                {error}
              </Callout>
            ) : null}
            <TextField control={control} name="email" label="E-mail" type="email" autoFocus />
          </DialogBody>
          <DialogFooter
            actions={
              <>
                <Button text="Cancelar" onClick={close} />
                <Button
                  type="submit"
                  intent="primary"
                  text="Enviar convite"
                  loading={formState.isSubmitting}
                />
              </>
            }
          />
        </form>
      </Dialog>
    </>
  );
}
