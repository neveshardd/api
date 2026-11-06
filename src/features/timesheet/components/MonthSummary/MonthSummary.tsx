"use client";

import { Classes } from "@blueprintjs/core";
import { formatDuration, type MonthSummary as Summary } from "../../domain/timeMath";
import { Item, List } from "./styles";

export function MonthSummary({ summary }: { summary: Summary }) {
  const items = [
    { label: "Dias trabalhados", value: String(summary.workedDays) },
    { label: "Horas normais", value: formatDuration(summary.regularMinutes) },
    { label: "Horas extras", value: formatDuration(summary.overtimeMinutes) },
    {
      label: "Saldo da jornada",
      value: `${summary.balanceMinutes > 0 ? "+" : ""}${formatDuration(summary.balanceMinutes)}`,
    },
    { label: "Faltas", value: String(summary.absences) },
    { label: "Atestados", value: String(summary.medicalLeaves) },
  ];

  return (
    <List aria-label="Resumo do mês">
      {items.map((item) => (
        <Item key={item.label}>
          <dt className={Classes.TEXT_MUTED}>{item.label}</dt>
          <dd>{item.value}</dd>
        </Item>
      ))}
    </List>
  );
}
