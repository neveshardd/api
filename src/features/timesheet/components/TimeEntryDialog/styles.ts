"use client";

import styled from "@emotion/styled";
import { media, spacing } from "@/config/layout";

export const Presets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing(2)};
`;

/** Horários em pares: entrada/intervalo/saída/extra, 2 colunas (1 no mobile). */
export const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: ${spacing(4)};

  ${media.compact} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Total = styled.p`
  margin: 0 0 ${spacing(4)};
  font-variant-numeric: tabular-nums;
`;
