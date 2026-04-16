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

export function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validarSenhaForte(senha: string): boolean {
  const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return senhaRegex.test(senha);
}

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

export function validarTelefone(telefone: string): boolean {
  const cleanTelefone = telefone.replace(/\D/g, "");
  return cleanTelefone.length >= 10 && cleanTelefone.length <= 11;
}
