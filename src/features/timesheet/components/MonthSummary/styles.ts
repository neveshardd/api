"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const List = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${spacing(4)};
  margin: 0;
`;

export const Item = styled.div`
  dt {
    font-size: var(--bp-typography-size-body-small);
  }

  dd {
    margin: ${spacing(1)} 0 0;
    font-size: var(--bp-typography-size-heading-small);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;
