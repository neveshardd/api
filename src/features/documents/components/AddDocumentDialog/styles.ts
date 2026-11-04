"use client";

import styled from "@emotion/styled";
import { media, spacing } from "@/config/layout";

/** Código e revisão lado a lado; empilhados em telas estreitas. */
export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: ${spacing(4)};

  ${media.compact} {
    grid-template-columns: minmax(0, 1fr);
  }
`;
