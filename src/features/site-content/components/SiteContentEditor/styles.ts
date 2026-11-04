"use client";

import { Colors } from "@blueprintjs/core";
import styled from "@emotion/styled";
import { spacing } from "@/config/layout";

export const EditorLayout = styled.div`
  display: grid;
  gap: ${spacing(6)};
  align-items: start;

  @media (min-width: 64rem) {
    grid-template-columns: 17rem minmax(0, 1fr);
  }
`;

/**
 * Lista de seções: o nome da página é um rótulo (caixa alta, pequeno, apagado, sem interação) e
 * cada seção é um item clicável com ícone, recuado sob a sua página.
 */
export const SectionNav = styled.nav`
  .bp6-menu-header {
    margin-top: ${spacing(3)};
    padding-top: ${spacing(2)};
    border-top: 0;
  }

  .bp6-menu-header:first-of-type {
    margin-top: 0;
  }

  .bp6-menu-header > h6 {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.5;
    text-transform: uppercase;
    color: ${Colors.GRAY3};
    cursor: default;
  }

  .bp6-dark & .bp6-menu-header > h6 {
    color: ${Colors.GRAY3};
  }

  @media (min-width: 64rem) {
    position: sticky;
    top: ${spacing(4)};
    max-height: calc(100vh - ${spacing(8)});
    overflow-y: auto;
  }
`;

export const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing(6)};
  min-width: 0;
`;

export const EditorHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing(3)};

  h2 {
    margin: 0;
  }
`;

export const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing(1)};

  .bp6-form-group {
    margin-bottom: ${spacing(3)};
  }
`;

export const FieldLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${spacing(2)};
`;

export const FooterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${spacing(2)};
  margin-top: ${spacing(4)};
`;

export const ImageGrid = styled.div`
  display: grid;
  gap: ${spacing(4)};
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
`;

export const ImageCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing(2)};

  img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: contain;
    border-radius: 4px;
    background:
      repeating-conic-gradient(rgb(0 0 0 / 0.06) 0% 25%, transparent 0% 50%) 50% / 16px 16px;
  }

  p {
    margin: 0;
    color: ${Colors.DARK_GRAY1};
  }

  p + p {
    color: ${Colors.GRAY1};
  }

  .bp6-dark & p {
    color: ${Colors.LIGHT_GRAY5};
  }

  .bp6-dark & p + p {
    color: ${Colors.GRAY4};
  }
`;

export const ImageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing(2)};
`;
