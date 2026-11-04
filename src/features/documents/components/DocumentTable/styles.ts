"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

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

export const RowActions = styled.div`
  display: flex;
  gap: ${spacing(1)};
`;
