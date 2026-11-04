"use client";

import { Button, Classes, Position } from "@blueprintjs/core";
import { IconX } from "@tabler/icons-react";
import { icon } from "@/components/shared/icons/AppIcon";
import { layoutConfig, motion } from "@/config/layout";
import { Sidebar } from "../Sidebar/Sidebar";
import { AnimatedDrawer, DialogContent } from "./styles";

interface NavigationDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

/**
 * Navegação em telas compactas.
 * O `Drawer` do Blueprint não expõe `role="dialog"` nem nome acessível e rotula o botão de
 * fechar em inglês; por isso o cabeçalho nativo não é usado e o conteúdo declara a semântica
 * de diálogo modal. Foco preso, Esc, backdrop e bloqueio de rolagem seguem o Overlay oficial.
 */
export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  return (
    <AnimatedDrawer
      isOpen={isOpen}
      onClose={onClose}
      position={Position.LEFT}
      size={layoutConfig.drawerWidth}
      className={Classes.DARK}
      transitionDuration={Math.max(motion.enterMs, motion.exitMs)}
    >
      <DialogContent role="dialog" aria-modal="true" aria-label="Navegação">
        <Sidebar
          onNavigate={onClose}
          footer={
            <Button
              variant="minimal"
              size="large"
              fill
              alignText="start"
              icon={icon(IconX)}
              text="Fechar navegação"
              onClick={onClose}
            />
          }
        />
      </DialogContent>
    </AnimatedDrawer>
  );
}
