import {
  IconBook,
  IconClock,
  IconDevices,
  IconId,
  IconLayoutDashboard,
  IconPhoto,
  IconSchool,
  IconShieldCheck,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import { documentCategoryLabels } from "@/features/documents/domain/documentCategory";

export interface NavigationItem {
  /** Identificador estável, usado como `key` e em testes. */
  readonly id: string;
  readonly label: string;
  readonly href: `/${string}`;
  readonly icon: TablerIcon;
}

/**
 * Fonte única da navegação do backoffice.
 * Sidebar, Drawer e Breadcrumbs derivam daqui; novas páginas só precisam ser registradas nesta lista.
 */
export const backofficeNavigation: readonly NavigationItem[] = [
  { id: "dashboard", label: "Painel", href: "/dashboard", icon: IconLayoutDashboard },
  {
    id: "onboarding",
    label: documentCategoryLabels.onboarding,
    href: "/integracao",
    icon: IconSchool,
  },
  {
    id: "occupational-safety",
    label: documentCategoryLabels["occupational-safety"],
    href: "/seguranca-do-trabalho",
    icon: IconShieldCheck,
  },
  {
    id: "institutional",
    label: documentCategoryLabels.institutional,
    href: "/documentos-institucionais",
    icon: IconBook,
  },
  {
    id: "site-content",
    label: "Textos e imagens",
    href: "/textos-e-imagens",
    icon: IconPhoto,
  },
  { id: "employees", label: "Colaboradores", href: "/colaboradores", icon: IconId },
  { id: "timesheet", label: "Ponto", href: "/ponto", icon: IconClock },
  { id: "users", label: "Usuários", href: "/usuarios", icon: IconUsers },
  { id: "devices", label: "Dispositivos", href: "/dispositivos", icon: IconDevices },
];

export function findNavigationItem(pathname: string): NavigationItem | undefined {
  return backofficeNavigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

export function isNavigationItemActive(item: NavigationItem, pathname: string): boolean {
  return findNavigationItem(pathname)?.id === item.id;
}
