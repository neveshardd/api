"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const TableViewport = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
  }

  caption {
    caption-side: bottom;
    padding-top: ${spacing(2)};
    text-align: left;
  }

  th,
  td {
    white-space: nowrap;
    vertical-align: middle;
  }
`;
