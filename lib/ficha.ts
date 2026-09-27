export type FichaInput = {
  nomeCompleto: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  graduacaoAtual: string;
  ultimaGraduacao: string;
};

export const PROFESSOR_RESPONSAVEL = "Bruno Wilson Franklin Vale da Silva";
export const EQUIPE = "LOBOS NEGROS";

export const GRADUACAO_OPTIONS = [
  { value: "Prajeid Branco", cores: ["#f7f3e8"] },
  { value: "Prajeid Amarelo", cores: ["#eab308"] },
  { value: "Prajeid Amarelo e Branco", cores: ["#eab308", "#f7f3e8"] },
  { value: "Prajeid Verde", cores: ["#1c7a3d"] },
  { value: "Prajeid Verde e Branco", cores: ["#1c7a3d", "#f7f3e8"] },
  { value: "Prajeid Azul", cores: ["#1d4ed8"] },
  { value: "Prajeid Azul e Branco", cores: ["#1d4ed8", "#f7f3e8"] },
  { value: "Prajeid Marrom", cores: ["#7c4a1e"] },
  { value: "Prajeid Marrom e Branco", cores: ["#7c4a1e", "#f7f3e8"] },
  { value: "Prajeid Vermelho", cores: ["#c81324"] },
] as const;

export const GRADUACOES: string[] = GRADUACAO_OPTIONS.map((g) => g.value);

export function formatDateBR(isoDate: string): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export type FichaFieldError = { field: keyof FichaInput; message: string };

export function validateFicha(data: Partial<FichaInput>): FichaFieldError[] {
  const errors: FichaFieldError[] = [];

  if (!data.nomeCompleto || data.nomeCompleto.trim().length < 5) {
    errors.push({ field: "nomeCompleto", message: "Informe o nome completo." });
  }
  if (!data.dataNascimento) {
    errors.push({ field: "dataNascimento", message: "Informe a data de nascimento." });
  }
  if (!data.telefone || data.telefone.replace(/\D/g, "").length < 10) {
    errors.push({ field: "telefone", message: "Informe um telefone válido com DDD." });
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: "email", message: "Informe um e-mail válido." });
  }
  if (!data.graduacaoAtual || !GRADUACOES.includes(data.graduacaoAtual)) {
    errors.push({ field: "graduacaoAtual", message: "Selecione a graduação atual." });
  }
  // Data da última graduação é opcional.

  return errors;
}
