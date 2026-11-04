"use client";

import { Classes } from "@blueprintjs/core";
import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

/** Apenas alinhamento: o NonIdealState centraliza por padrão. */
export const LeftAligned = styled.div`
  padding: ${spacing(2)} 0;

  .${Classes.NON_IDEAL_STATE} {
    justify-content: flex-start;
    align-items: center;
    height: auto;
  }

  .${Classes.NON_IDEAL_STATE} h4 {
    margin-bottom: ${spacing(1)};
  }
`;
