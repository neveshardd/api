"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const ToolbarBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing(3)};
  margin-bottom: ${spacing(6)};
  padding: ${spacing(3)} ${spacing(6)};
  background-color: var(--bp-palette-white);

  .bp6-dark & {
    background-color: var(--bp-palette-dark-gray-3);
  }

  @media print {
    display: none;
  }
`;

export const PrintCanvas = styled.main`
  min-height: 100dvh;
  padding-bottom: ${spacing(8)};

  @media print {
    padding: 0;
  }
`;
