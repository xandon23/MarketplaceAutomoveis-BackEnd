export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const cpfs = cpf.split("").map((el) => +el);
  const rest = (count: number) =>
    ((cpfs
      .slice(0, count - 12)
      .reduce((soma, el, i) => soma + el * (count - i), 0) *
      10) %
      11) %
    10;

  return rest(10) === cpfs[9] && rest(11) === cpfs[10];
}
