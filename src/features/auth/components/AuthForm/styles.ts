"use client";

import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${spacing(1)};
`;

export const FormHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing(2)};
  margin-bottom: ${spacing(4)};

  h1 {
    margin: 0;
    font-size: var(--bp-typography-size-heading-medium);
  }

  p {
    margin: 0;
  }
`;

export const FormFeedback = styled.div`
  margin-bottom: ${spacing(4)};
`;

export const FormActions = styled.div`
  margin-top: ${spacing(3)};
`;

export const FormNotice = styled.p`
  margin: ${spacing(4)} 0 0;
  font-size: var(--bp-typography-size-body-small);
`;
