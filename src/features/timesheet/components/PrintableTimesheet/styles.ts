"use client";

import { css } from "@emotion/react";
import styled from "@emotion/styled";

/**
 * Folha fiel ao modelo em papel: A4 retrato, tabelas com bordas finas e fonte serifada.
 * Cores fixas (preto sobre branco) de propósito: é um documento impresso, não a interface.
 */
const serif = `"Times New Roman", Times, serif`;
const sans = `Calibri, Carlito, "Segoe UI", Arial, sans-serif`;

export const printPageStyles = css`
  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    html,
    body,
    .bp6-dark body {
      background: #ffffff !important;
    }
  }
`;

export const Sheet = styled.article`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 210mm;
  height: 297mm;
  margin: 0 auto 8mm;
  padding: 12mm 16mm 10mm;
  background: #ffffff;
  color: #000000;
  font-family: ${serif};
  box-shadow: 0 1px 6px rgb(0 0 0 / 0.25);
  overflow: hidden;

  @media print {
    margin: 0;
    box-shadow: none;
    break-after: page;

    &:last-of-type {
      break-after: auto;
    }
  }
`;

export const SheetBody = styled.div`
  flex: 1;
`;

export const Logo = styled.img`
  display: block;
  width: 38mm;
  height: auto;
  margin-left: 6mm;
`;

export const Title = styled.h1`
  margin: 5mm 0 6mm;
  font-size: 15pt;
  font-weight: 700;
  text-align: center;
`;

const bordered = `
  width: 100%;
  border-collapse: collapse;
  font-family: ${serif};

  th,
  td {
    border: 0.75pt solid #000000;
    padding: 0.3mm 1.5mm;
  }
`;

export const InfoTable = styled.table`
  ${bordered}
  margin-bottom: 9mm;
  font-size: 11pt;

  td {
    width: 50%;
    height: 5mm;
  }
`;

export const DaysTable = styled.table`
  ${bordered}
  font-size: 11pt;

  th {
    font-weight: 700;
    line-height: 1.1;
    vertical-align: top;
  }

  td {
    height: 4.45mm;
    padding-top: 0;
    padding-bottom: 0;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  th:nth-of-type(1),
  td:nth-of-type(1) {
    width: 6%;
  }

  th:nth-of-type(7),
  td:nth-of-type(7) {
    width: 38%;
  }
`;

export const Mark = styled.span`
  display: block;
  text-align: left;
  font-size: 8pt;
`;

export const Footer = styled.footer`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6mm;
  font-family: ${sans};
  font-size: 8.5pt;
  text-align: center;
`;
