export interface Employee {
  readonly id: string;
  readonly name: string;
  readonly registration: string | null;
  readonly cpf: string | null;
  readonly jobTitle: string | null;
  readonly admissionDate: string | null;
  readonly dailyMinutes: number;
  readonly active: boolean;
}
