"use client";

import styled from "@emotion/styled";
import { media, spacing } from "@/config/layout";

export const AuthMain = styled.main`
  display: flex;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  padding: ${spacing(6)};
`;

export const AuthPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing(8)};
  width: 100%;
  max-width: 400px;
  padding: ${spacing(10)};
  background-color: var(--bp-palette-white);

  .bp6-dark & {
    background-color: var(--bp-palette-dark-gray-3);
  }

  ${media.compact} {
    padding: ${spacing(6)};
  }
`;

/** No tema escuro a logo (texto azul-marinho) é exibida em branco para manter o contraste. */
export const Logo = styled.img`
  display: block;
  width: 140px;
  height: auto;

  .bp6-dark & {
    filter: brightness(0) invert(1);
  }
`;
