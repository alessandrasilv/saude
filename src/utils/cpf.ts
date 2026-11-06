/**
 * Algoritmo oficial de validação de CPF (Receita Federal do Brasil)
 * Realiza a conferência de dígitos verificadores (Módulo 11)
 * e rejeita números conhecidos repetidos (000.000.000-00, 111.111.111-11, etc.)
 */
export function isValidCPF(cpfRaw: string): boolean {
  if (!cpfRaw) return false;
  const cpf = cpfRaw.replace(/\D/g, '');

  if (cpf.length !== 11) return false;

  // Rejeita repetições óbvias
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9), 10)) return false;

  // 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatSUSCard(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}
