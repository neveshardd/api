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

export const RowActions = styled.div`
  display: flex;
  gap: ${spacing(1)};
`;

export const Preview = styled.video`
  display: block;
  width: 100%;
  max-height: 70vh;
  background-color: var(--bp-palette-black);
`;
