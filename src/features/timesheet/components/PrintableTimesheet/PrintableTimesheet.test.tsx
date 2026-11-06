import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrintableTimesheet } from "./PrintableTimesheet";

const employee = {
  id: "e1",
  name: "Francisco Lucas Silva Venancio",
  registration: "000034",
  cpf: "04621523325",
  jobTitle: "Meio Oficial",
  admissionDate: null,
  dailyMinutes: 480,
  active: true,
};

const times = {
  lunchOut: null,
  lunchIn: null,
  overtimeStart: null,
  overtimeEnd: null,
  notes: null,
};

describe("folha de ponto exportada", () => {
  it("segue o layout do modelo (cabeçalho, colaborador, dias e rodapé)", () => {
    render(
      <PrintableTimesheet
        month="2026-09"
        days={30}
        settings={{
          showLogo: true,
          title: "Folha de Ponto",
          footerLine1: "AGAGE MONTAGEM INDUSTRIAL LTDA – CNPJ: 51.615.570/0001-27",
          footerLine2: "Endereço",
          footerLine3: "Telefone",
        }}
        sheets={[
          {
            employee,
            entries: [
              {
                ...times,
                date: "2026-09-01",
                dayType: "work",
                clockIn: "08:00",
                lunchOut: "12:00",
                lunchIn: "13:00",
                clockOut: "17:00",
                overtimeStart: "17:00",
                overtimeEnd: "19:00",
              },
              { ...times, date: "2026-09-02", dayType: "medical", clockIn: null, clockOut: null },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Folha de Ponto - Período: 01/09/2026 / 30/09/2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("046.215.233-25")).toBeInTheDocument();
    expect(screen.getByText("000034")).toBeInTheDocument();

    const [, days] = screen.getAllByRole("table");
    if (!days) throw new Error("tabela de dias ausente");
    expect(
      within(days)
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual([
      "Dia",
      "Entrada",
      "Início do Intervalo",
      "Fim do Intervalo",
      "Saída",
      "Hora Extras",
      "Assinatura",
    ]);
    const rows = within(days).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(30);
    expect(rows[0]?.textContent).toBe("108:0012:0013:0017:002h");
    expect(rows[1]?.textContent).toBe("2ATESTADO");
    // 05/09/2026 é sábado e 06/09/2026 é domingo, como no modelo.
    expect(rows[4]?.textContent).toBe("5SABADO");
    expect(rows[5]?.textContent).toBe("6DOMINGO");

    expect(
      screen.getByText("AGAGE MONTAGEM INDUSTRIAL LTDA – CNPJ: 51.615.570/0001-27"),
    ).toBeInTheDocument();
  });
});
