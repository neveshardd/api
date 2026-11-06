"use client";

import styled from "@emotion/styled";
import { media, spacing } from "@/config/layout";

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${spacing(4)};

  ${media.compact} {
    grid-template-columns: minmax(0, 1fr);
  }
`;
