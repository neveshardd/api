"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const TableViewport = styled.div`
  overflow-x: auto;
  max-height: 40vh;

  table {
    width: 100%;
  }

  td {
    vertical-align: middle;
  }
`;

export const Section = styled.section`
  margin-top: ${spacing(6)};

  h4 {
    margin: 0 0 ${spacing(3)};
  }
`;
