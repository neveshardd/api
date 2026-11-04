"use client";

import styled from "@emotion/styled";
import { visuallyHidden } from "@/components/shared/VisuallyHidden/VisuallyHidden";
import { spacing } from "@/config/layout";

export const HiddenTitle = styled.h1`
  ${visuallyHidden}
`;

export const PageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${spacing(2)};
`;
