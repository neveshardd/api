"use client";

import { Button, NonIdealState } from "@blueprintjs/core";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import { ErrorArea } from "./styles";

interface BackofficeErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Falha ao carregar uma área do backoffice (ex.: banco indisponível).
 * Detalhes técnicos não são exibidos; o `digest` permite correlacionar com o log do servidor.
 */
export default function BackofficeError({ error, reset }: BackofficeErrorProps) {
  return (
    <ErrorArea role="alert">
      <NonIdealState
        icon={icon(IconAlertTriangle, ICON_SIZE.nonIdeal)}
        title="Não foi possível carregar esta área"
        description={error.digest ? `Código de referência: ${error.digest}` : undefined}
        action={<Button icon={icon(IconRefresh)} text="Tentar novamente" onClick={reset} />}
      />
    </ErrorArea>
  );
}
