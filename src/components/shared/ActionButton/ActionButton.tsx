"use client";

import { Alert, Button, type Intent } from "@blueprintjs/core";
import { useState, useTransition } from "react";
import { useToaster } from "@/components/providers/ToasterProvider";
import { ICON_SIZE, icon as renderIcon, type TablerIcon } from "@/components/shared/icons/AppIcon";
import type { ActionResult } from "@/lib/errors/userFacingError";

interface ActionButtonProps {
  readonly text: string;
  readonly icon?: TablerIcon;
  readonly intent?: Intent;
  /** Server action a executar; o resultado vira um aviso (toast). */
  readonly action: () => Promise<ActionResult>;
  /** Quando informado, pede confirmação em um `Alert` antes de executar. */
  readonly confirmation?: { readonly message: string; readonly confirmText: string };
  /** Nome acessível completo quando o texto visível é curto (ex.: "Remover acesso de x@y"). */
  readonly ariaLabel?: string;
}

export function ActionButton({
  text,
  icon,
  intent,
  action,
  confirmation,
  ariaLabel,
}: ActionButtonProps) {
  const { notify } = useToaster();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = await action();
      setConfirming(false);
      if (result.ok) notify(result.message ?? "Concluído.", "success");
      else notify(result.error, "danger");
    });

  return (
    <>
      <Button
        variant="minimal"
        size="small"
        icon={icon ? renderIcon(icon) : undefined}
        intent={intent}
        text={text}
        aria-label={ariaLabel}
        loading={pending && !confirmation}
        onClick={() => (confirmation ? setConfirming(true) : run())}
      />
      {confirmation ? (
        <Alert
          isOpen={confirming}
          intent={intent}
          icon={icon ? renderIcon(icon, ICON_SIZE.alert) : undefined}
          confirmButtonText={confirmation.confirmText}
          cancelButtonText="Cancelar"
          loading={pending}
          canEscapeKeyCancel={!pending}
          onConfirm={run}
          onCancel={() => setConfirming(false)}
        >
          <p>{confirmation.message}</p>
        </Alert>
      ) : null}
    </>
  );
}
