"use client";

import styled from "@emotion/styled";

/**
 * Integra o FullCalendar ao tema do Blueprint pelas variáveis CSS oficiais do próprio
 * FullCalendar, apontando para os tokens do Blueprint (claro e escuro).
 */
export const CalendarFrame = styled.div`
  --fc-border-color: var(--bp-surface-border-color-default);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: var(--bp-surface-layer-color-default);
  --fc-today-bg-color: var(--bp-surface-background-color-primary-rest);
  --fc-highlight-color: var(--bp-surface-background-color-primary-hover);
  --fc-event-text-color: var(--bp-palette-white);

  .fc .fc-daygrid-day {
    cursor: pointer;
  }

  .fc .fc-daygrid-day-number,
  .fc .fc-col-header-cell-cushion {
    color: inherit;
    text-decoration: none;
  }

  .fc .fc-col-header-cell-cushion {
    text-transform: capitalize;
    font-weight: 600;
  }

  .fc .fc-event {
    cursor: pointer;
    font-size: var(--bp-typography-size-body-small);
    font-variant-numeric: tabular-nums;
  }
`;
