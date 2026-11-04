"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

/** Reserva a altura do widget (65px) para evitar deslocamento do layout ao carregar. */
export const TurnstileContainer = styled.div`
  min-height: 65px;
  margin-top: ${spacing(2)};
`;
