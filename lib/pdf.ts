import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDateBR, PROFESSOR_RESPONSAVEL, EQUIPE, type FichaInput } from "./ficha";

const BASE_PDF_PATH = path.join(process.cwd(), "templates", "ficha-graduacao-base.pdf");

// Coordinates (PDF points, A4) calibrated against templates/ficha-graduacao-base.pdf.
// If the template is ever replaced, regenerate the base PDF and recalibrate these.
const FIELD_POSITIONS: Record<keyof FichaInput, { centerX: number; baselineY: number; maxWidth: number }> = {
  nomeCompleto: { centerX: 297.84, baselineY: 553, maxWidth: 520 },
  dataNascimento: { centerX: 159.96, baselineY: 473.4, maxWidth: 250 },
  telefone: { centerX: 440.16, baselineY: 472.9, maxWidth: 240 },
  email: { centerX: 297.84, baselineY: 422.5, maxWidth: 520 },
  graduacaoAtual: { centerX: 154.68, baselineY: 306.8, maxWidth: 250 },
  ultimaGraduacao: { centerX: 440.76, baselineY: 305.4, maxWidth: 240 },
};

// Professor/Equipe are fixed values (not part of the form), but drawn the same way:
// the base PDF has that whole spot whited out (text + underline) because the .docx's own
// static text there overlapped the line instead of sitting above it (see
// scripts/generate-base-pdf.mjs). We redraw both the text and a fresh underline here.
const FIXED_FIELDS = [
  { text: PROFESSOR_RESPONSAVEL, centerX: 155.76, baselineY: 359.3, maxWidth: 250, lineX1: 27.84, lineX2: 283.2 },
  { text: EQUIPE, centerX: 440.16, baselineY: 359.3, maxWidth: 240, lineX1: 312.48, lineX2: 567.84 },
];
const LINE_Y = 356.3;

const BASE_FONT_SIZE = 12;
const MIN_FONT_SIZE = 8;

function drawCentered(page: PDFPage, font: PDFFont, text: string, centerX: number, baselineY: number, maxWidth: number) {
  if (!text) return;
  let size = BASE_FONT_SIZE;
  let width = font.widthOfTextAtSize(text, size);
  while (width > maxWidth && size > MIN_FONT_SIZE) {
    size -= 0.5;
    width = font.widthOfTextAtSize(text, size);
  }
  page.drawText(text, {
    x: centerX - width / 2,
    y: baselineY,
    size,
    font,
    color: rgb(0.13, 0.1, 0.09),
  });
}

export async function gerarFichaPdf(data: FichaInput): Promise<Buffer> {
  const baseBytes = fs.readFileSync(BASE_PDF_PATH);
  const pdfDoc = await PDFDocument.load(baseBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const values: Record<keyof typeof FIELD_POSITIONS, string> = {
    nomeCompleto: data.nomeCompleto,
    dataNascimento: formatDateBR(data.dataNascimento),
    telefone: data.telefone,
    email: data.email,
    graduacaoAtual: data.graduacaoAtual,
    ultimaGraduacao: formatDateBR(data.ultimaGraduacao),
  };

  for (const key of Object.keys(FIELD_POSITIONS) as (keyof typeof FIELD_POSITIONS)[]) {
    const pos = FIELD_POSITIONS[key];
    drawCentered(page, font, values[key], pos.centerX, pos.baselineY, pos.maxWidth);
  }

  for (const f of FIXED_FIELDS) {
    drawCentered(page, font, f.text, f.centerX, f.baselineY, f.maxWidth);
    page.drawLine({
      start: { x: f.lineX1, y: LINE_Y },
      end: { x: f.lineX2, y: LINE_Y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

  return Buffer.from(await pdfDoc.save());
}
