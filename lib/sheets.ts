import { google } from "googleapis";
import { formatDateBR, type FichaInput } from "./ficha";

export async function salvarNaPlanilha(data: FichaInput): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!sheetId || !clientEmail || !privateKey) {
    console.warn(
      "Google Sheets não configurado (faltam GOOGLE_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY). Pulando registro na planilha."
    );
    return;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toLocaleString("pt-BR"),
          data.nomeCompleto,
          formatDateBR(data.dataNascimento),
          data.telefone,
          data.email,
          data.graduacaoAtual,
          formatDateBR(data.ultimaGraduacao),
        ],
      ],
    },
  });
}
