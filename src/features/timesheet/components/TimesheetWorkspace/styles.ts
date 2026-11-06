"use client";

import styled from "@emotion/styled";
import { media, spacing } from "@/config/layout";

export const Workspace = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing(6)};
`;

export const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 420px) 1fr;
  align-items: end;
  gap: ${spacing(4)};

  .bp6-form-group {
    margin: 0;
  }

  ${media.compact} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ToolbarActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${spacing(2)};

  ${media.compact} {
    justify-content: flex-start;
  }
`;

export const CalendarHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing(4)};

  h2 {
    margin: 0;
    font-size: var(--bp-typography-size-heading-small);
    text-transform: capitalize;
  }
`;

export const DayShortcut = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing(2)};
  margin-left: auto;

  .bp6-form-group {
    margin: 0;
  }

  ${media.compact} {
    margin-left: 0;
  }
`;
