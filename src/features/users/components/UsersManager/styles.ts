"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${spacing(4)};
`;

export const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing(3)};
  min-height: ${spacing(8)};

  h2 {
    margin: 0;
    font-size: var(--bp-typography-size-heading-small);
  }
`;

export const TableViewport = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
  }

  th,
  td {
    white-space: nowrap;
    vertical-align: middle;
  }
`;
