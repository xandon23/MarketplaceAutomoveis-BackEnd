// utils/validators.ts

/**
 * Validação de CPF (Algoritmo oficial)
 */
export function validarCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/[^\d]+/g, "");
  if (cleanCpf.length !== 11 || !!cleanCpf.match(/(\d)\1{10}/)) return false;

  const cpfs = cleanCpf.split("").map((el) => +el);
  const rest = (count: number) =>
    ((cpfs
      .slice(0, count - 12)
      .reduce((soma, el, i) => soma + el * (count - i), 0) *
      10) %
      11) %
    10;

  return rest(10) === cpfs[9] && rest(11) === cpfs[10];
}

/**
 * Validação de E-mail (Regex profissional)
 */
export function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validação de Senha Forte (Requisito da Rubrica: Letras, Números e min 8 chars)
 */
export function validarSenhaForte(senha: string): boolean {
  const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return senhaRegex.test(senha);
}

/**
 * Validação de Maioridade (18 anos)
 */
export function isMaiorDeIdade(dataNascimento: string): boolean {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade >= 18;
}

/**
 * Validação de Telefone Brasileiro (Ex: 11999998888 ou 1133334444)
 */
export function validarTelefone(telefone: string): boolean {
  const cleanTelefone = telefone.replace(/\D/g, "");
  return cleanTelefone.length >= 10 && cleanTelefone.length <= 11;
}
