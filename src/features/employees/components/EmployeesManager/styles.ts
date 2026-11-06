"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing(4)};
`;

export const Header = styled.div`
  display: flex;
  justify-content: flex-end;
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
