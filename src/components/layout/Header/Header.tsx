"use client";

import { Alignment, Button, Navbar, NavbarGroup, Tooltip } from "@blueprintjs/core";
import { IconMenu2, IconMoon, IconSun } from "@tabler/icons-react";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Breadcrumbs } from "../Breadcrumbs/Breadcrumbs";
import { UserMenu, type UserMenuUser } from "../UserMenu/UserMenu";
import { HeaderRoot, NavigationToggle } from "./styles";

export type HeaderUser = UserMenuUser;

interface HeaderProps {
  readonly user: HeaderUser;
  readonly navigationOpen: boolean;
  readonly onOpenNavigation: () => void;
}

export function Header({ user, navigationOpen, onOpenNavigation }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <HeaderRoot>
      <Navbar>
        <NavbarGroup align={Alignment.START}>
          <NavigationToggle>
            <Button
              variant="minimal"
              icon={icon(IconMenu2, ICON_SIZE.large)}
              aria-label="Abrir navegação"
              aria-expanded={navigationOpen}
              aria-haspopup="dialog"
              onClick={onOpenNavigation}
            />
          </NavigationToggle>
          <Breadcrumbs />
        </NavbarGroup>
        <NavbarGroup align={Alignment.END}>
          <Tooltip content={themeLabel} placement="bottom-end">
            <Button
              variant="minimal"
              icon={icon(theme === "dark" ? IconSun : IconMoon, ICON_SIZE.large)}
              aria-label={themeLabel}
              onClick={toggleTheme}
            />
          </Tooltip>
          <UserMenu user={user} />
        </NavbarGroup>
      </Navbar>
    </HeaderRoot>
  );
}
