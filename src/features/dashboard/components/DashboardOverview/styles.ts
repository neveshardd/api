"use client";

import { Colors } from "@blueprintjs/core";
import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

/*
 * Textos fora dos componentes de tipografia do Blueprint não herdam a cor do tema escuro:
 * as cores ficam explícitas para os dois temas (paleta oficial do Blueprint).
 */

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${spacing(4)};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${Colors.GRAY1};

  .bp6-dark & {
    color: ${Colors.GRAY4};
  }
`;

export const Grid = styled.div`
  display: grid;
  gap: ${spacing(4)};
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));

  > .bp6-card {
    display: flex;
    flex-direction: column;
    gap: ${spacing(2)};
  }

  p {
    margin: 0;
  }

  .bp6-tag {
    align-self: flex-start;
  }

  > .bp6-card > div:last-child {
    margin-top: auto;
    padding-top: ${spacing(2)};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing(2)};
  color: ${Colors.BLUE3};

  .bp6-dark & {
    color: ${Colors.BLUE5};
  }

  h3 {
    margin: 0;
  }
`;

export const CardStat = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${Colors.DARK_GRAY1};

  .bp6-dark & {
    color: ${Colors.LIGHT_GRAY5};
  }
`;
