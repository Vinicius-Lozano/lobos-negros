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

// Nome do PDF da ficha (anexo do e-mail e download no navegador), ex.: Ficha_de_Graduacao_Joao_Silva.pdf
export function nomeArquivoFicha(nomeCompleto: string): string {
  const nome = nomeCompleto
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return `Ficha_de_Graduacao_${nome}.pdf`;
}

export type FichaFieldError ={ field: keyof FichaInput; message: string };

// Limites dos campos de data: de 1900 até hoje, sempre com ano de 4 dígitos.
export const DATA_MINIMA = "1900-01-01";

// Aceita só AAAA-MM-DD de um dia que existe, entre DATA_MINIMA e hoje.
// (Folga de 1 dia no máximo para o servidor, que roda em UTC, não recusar o "hoje" de quem está no Brasil.)
export function dataValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [ano, mes, dia] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return false;
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return iso >= DATA_MINIMA && iso <= amanha;
}

export function validateFicha(data: Partial<FichaInput>): FichaFieldError[] {
  const errors: FichaFieldError[] = [];

  if (!data.nomeCompleto || data.nomeCompleto.trim().length < 5) {
    errors.push({ field: "nomeCompleto", message: "Informe o nome completo." });
  }
  if (!data.dataNascimento) {
    errors.push({ field: "dataNascimento", message: "Informe a data de nascimento." });
  } else if (!dataValida(data.dataNascimento)) {
    errors.push({ field: "dataNascimento", message: "Informe uma data de nascimento válida." });
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
  // Data da última graduação é opcional, mas se vier tem que ser válida.
  if (data.ultimaGraduacao && !dataValida(data.ultimaGraduacao)) {
    errors.push({ field: "ultimaGraduacao", message: "Informe uma data da última graduação válida." });
  }

  return errors;
}
