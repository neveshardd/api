"use client";

import { Classes } from "@blueprintjs/core";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { mediaQuery } from "@/config/layout";
import { Header, type HeaderUser } from "../Header/Header";
import { NavigationDrawer } from "../NavigationDrawer/NavigationDrawer";
import { Sidebar } from "../Sidebar/Sidebar";
import { ContentColumn, Main, ShellRoot, SidebarColumn, SkipLink } from "./styles";

const MAIN_CONTENT_ID = "conteudo-principal";

export function AppShell({ children, user }: { children: ReactNode; user: HeaderUser }) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  const openNavigation = useCallback(() => setNavigationOpen(true), []);
  const closeNavigation = useCallback(() => setNavigationOpen(false), []);

  // Ao passar para o layout largo a sidebar fixa reaparece; o Drawer não deve ficar aberto.
  useEffect(() => {
    const wide = window.matchMedia(mediaQuery.wide);
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setNavigationOpen(false);
    };
    wide.addEventListener("change", handleChange);
    return () => wide.removeEventListener("change", handleChange);
  }, []);

  return (
    <ShellRoot>
      <SkipLink href={`#${MAIN_CONTENT_ID}`} className={Classes.BUTTON}>
        Pular para o conteúdo
      </SkipLink>

      <SidebarColumn>
        <Sidebar />
      </SidebarColumn>

      <ContentColumn>
        <Header user={user} navigationOpen={navigationOpen} onOpenNavigation={openNavigation} />
        <Main id={MAIN_CONTENT_ID} tabIndex={-1}>
          {children}
        </Main>
      </ContentColumn>

      <NavigationDrawer isOpen={navigationOpen} onClose={closeNavigation} />
    </ShellRoot>
  );
}
