"use client";

import { AnchorButton, Button, Menu, MenuItem, PopoverNext } from "@blueprintjs/core";
import { IconArrowsExchange, IconCheck, IconEye, IconTrash } from "@tabler/icons-react";
import { useTransition } from "react";
import { useToaster } from "@/components/providers/ToasterProvider";
import { ActionButton } from "@/components/shared/ActionButton/ActionButton";
import { icon } from "@/components/shared/icons/AppIcon";
import { changeDocumentStatusAction, deleteDocumentAction } from "../../actions";
import type { ControlledDocument } from "../../domain/document";
import { DOCUMENT_STATUSES, documentStatusLabels } from "../../domain/documentStatus";
import { RowActions } from "./styles";

export function DocumentRowActions({ document }: { document: ControlledDocument }) {
  const { notify } = useToaster();
  const [pending, startTransition] = useTransition();

  const changeStatus = (status: string) =>
    startTransition(async () => {
      const result = await changeDocumentStatusAction(document.id, status);
      notify(
        result.ok ? (result.message ?? "Atualizado.") : result.error,
        result.ok ? "success" : "danger",
      );
    });

  return (
    <RowActions>
      <AnchorButton
        variant="minimal"
        size="small"
        icon={icon(IconEye)}
        text="Abrir"
        href={`/api/admin/documents/${document.id}`}
        target="_blank"
        rel="noopener"
        aria-label={`Abrir ${document.code} em nova aba`}
      />
      <PopoverNext
        placement="bottom-end"
        arrow={false}
        content={
          <Menu aria-label={`Situação de ${document.code}`}>
            {DOCUMENT_STATUSES.map((status) => (
              <MenuItem
                key={status}
                text={documentStatusLabels[status]}
                icon={document.status === status ? icon(IconCheck) : undefined}
                label={document.status === status ? "Atual" : undefined}
                disabled={document.status === status}
                onClick={() => changeStatus(status)}
              />
            ))}
          </Menu>
        }
      >
        <Button
          variant="minimal"
          size="small"
          icon={icon(IconArrowsExchange)}
          text="Situação"
          loading={pending}
          aria-label={`Alterar situação de ${document.code}`}
        />
      </PopoverNext>
      <ActionButton
        text="Excluir"
        ariaLabel={`Excluir ${document.code}`}
        icon={IconTrash}
        intent="danger"
        action={() => deleteDocumentAction(document.id)}
        confirmation={{
          message: `O documento ${document.code} e o arquivo PDF serão excluídos definitivamente.`,
          confirmText: "Excluir documento",
        }}
      />
    </RowActions>
  );
}
