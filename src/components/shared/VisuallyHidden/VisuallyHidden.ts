"use client";

import { css } from "@emotion/react";
import styled from "@emotion/styled";

/** Oculta visualmente mantendo o conteúdo disponível para leitores de tela. */
export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const VisuallyHidden = styled.span`
  ${visuallyHidden}
`;
