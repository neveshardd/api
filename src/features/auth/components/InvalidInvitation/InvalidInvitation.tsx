"use client";

import { Classes, NonIdealState } from "@blueprintjs/core";
import { IconBan } from "@tabler/icons-react";
import Link from "next/link";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";

export function InvalidInvitation() {
  return (
    <NonIdealState
      icon={icon(IconBan, ICON_SIZE.nonIdeal)}
      title="Link inválido ou expirado"
      description="Peça a um administrador para reenviar o convite."
      action={
        <Link href="/login" className={`${Classes.BUTTON} ${Classes.MINIMAL}`}>
          Ir para o login
        </Link>
      }
    />
  );
}
