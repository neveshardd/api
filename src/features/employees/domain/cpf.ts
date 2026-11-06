/** Mantém apenas os dígitos. */
export function cpfDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Validação oficial dos dígitos verificadores do CPF. */
export function isValidCpf(value: string): boolean {
  const digits = cpfDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const check = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index++) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

/** "04621523325" → "046.215.233-25". */
export function formatCpf(value: string | null | undefined): string {
  const digits = cpfDigits(value ?? "");
  if (digits.length !== 11) return value ?? "";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
