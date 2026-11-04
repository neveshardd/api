"use client";

import { Button, ButtonGroup, Classes } from "@blueprintjs/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, icon, type TablerIcon } from "@/components/shared/icons/AppIcon";
import { PaginationRoot } from "./styles";

interface DocumentPaginationProps {
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

const linkClassName = [Classes.BUTTON, Classes.MINIMAL].join(" ");

function PageLink({ href, label, icon }: { href: string; label: string; icon: TablerIcon }) {
  return (
    <Link href={href} className={linkClassName} aria-label={label}>
      <AppIcon icon={icon} />
    </Link>
  );
}

/** Paginação por URL (`?page=`): navegável sem JavaScript, compartilhável e com histórico. */
export function DocumentPagination({ page, pageCount, total }: DocumentPaginationProps) {
  const pathname = usePathname();
  const hrefFor = (target: number) => (target === 1 ? pathname : `${pathname}?page=${target}`);

  return (
    <PaginationRoot aria-label="Paginação">
      <span className={Classes.TEXT_MUTED} aria-live="polite">
        Página {page} de {pageCount} · {total} {total === 1 ? "documento" : "documentos"}
      </span>
      <ButtonGroup>
        {page > 1 ? (
          <PageLink href={hrefFor(page - 1)} label="Página anterior" icon={IconChevronLeft} />
        ) : (
          <Button
            variant="minimal"
            icon={icon(IconChevronLeft)}
            aria-label="Página anterior"
            disabled
          />
        )}
        {page < pageCount ? (
          <PageLink href={hrefFor(page + 1)} label="Próxima página" icon={IconChevronRight} />
        ) : (
          <Button
            variant="minimal"
            icon={icon(IconChevronRight)}
            aria-label="Próxima página"
            disabled
          />
        )}
      </ButtonGroup>
    </PaginationRoot>
  );
}
