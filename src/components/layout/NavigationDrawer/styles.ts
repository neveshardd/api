"use client";

import { Classes, Drawer } from "@blueprintjs/core";
import styled from "@emotion/styled";
import { motion } from "@/config/layout";

const overlay = Classes.OVERLAY;

/**
 * Drawer oficial com transição ajustada para navegação móvel.
 * O padrão do Blueprint abre em 200ms e fecha em 100ms com a mesma curva, enquanto o backdrop
 * leva 200ms; o painel some antes do fundo e o movimento parece abrupto. Aqui: desaceleração
 * ao entrar, aceleração ao sair, durações sincronizadas com o Overlay (`transitionDuration`).
 * `&&&` supera a especificidade de `.bp6-drawer.bp6-position-left.bp6-overlay-*`.
 */
export const AnimatedDrawer = styled(Drawer)`
  &&& {
    will-change: transform;
  }

  &&&.${overlay}-enter, &&&.${overlay}-appear {
    transform: translateX(-100%);
  }

  &&&.${overlay}-enter-active, &&&.${overlay}-appear-active {
    transform: translateX(0);
    transition: transform ${motion.enterMs}ms ${motion.enterEasing};
  }

  &&&.${overlay}-exit {
    transform: translateX(0);
  }

  &&&.${overlay}-exit-active {
    transform: translateX(-100%);
    transition: transform ${motion.exitMs}ms ${motion.exitEasing};
  }

  @media (prefers-reduced-motion: reduce) {
    &&&.${overlay}-enter-active,
    &&&.${overlay}-appear-active,
    &&&.${overlay}-exit-active {
      transition: none;
    }
  }
`;

export const DialogContent = styled.div`
  height: 100%;
`;
