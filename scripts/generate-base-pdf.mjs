// Regenerates templates/ficha-graduacao-base.pdf from templates/ficha-graduacao.docx
// with all fields blank. Run this only if the .docx template itself changes.
//
// Requires LibreOffice installed locally (`soffice` on PATH) — this is a one-time
// build step you run on your machine, not something the deployed app runs.
//
// After regenerating, re-check the field coordinates in lib/pdf.ts: if the layout
// shifted, the overlaid text in lib/pdf.ts will no longer sit on the printed lines.
//
// Usage: node scripts/generate-base-pdf.mjs

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { PDFDocument, rgb } from "pdf-lib";

const root = path.join(import.meta.dirname, "..");
const templatePath = path.join(root, "templates", "ficha-graduacao.docx");
const outDir = path.join(root, "templates");
const blankDocxPath = path.join(outDir, "ficha-graduacao-base.docx");

const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
  delimiters: { start: "<<", end: ">>" },
  paragraphLoop: true,
  linebreaks: true,
});

doc.render({
  "Nome Completo": "",
  "Data De Nascimento": "",
  Telefone: "",
  "E-mail": "",
  "Graduação Atual": "",
  "Ultima Graduação": "",
  "Professor Responsável": "",
  Equipe: "",
});

fs.writeFileSync(blankDocxPath, doc.getZip().generate({ type: "nodebuffer" }));

execFileSync("soffice", ["--headless", "--convert-to", "pdf", blankDocxPath, "--outdir", outDir], {
  stdio: "inherit",
});

fs.unlinkSync(blankDocxPath);

// The source .docx has "Bruno Wilson Franklin Vale da Silva" / "LOBOS NEGROS" as
// static (non-templated) text, badly vertically aligned in its table cell — it prints
// below the field's underline instead of above it, overlapping the line itself. There's
// no template tag for it, so blanking it via docxtemplater does nothing. We white out a
// generous area (clearing the baked text AND its underline) and lib/pdf.ts redraws both
// the text and a fresh underline in the right spot, like every other field.
const outPdfPath = path.join(outDir, "ficha-graduacao-base.pdf");
const pdfDoc = await PDFDocument.load(fs.readFileSync(outPdfPath));
const page = pdfDoc.getPages()[0];
const white = rgb(1, 1, 1);
// Coordinates calibrated against this exact base PDF (A4, 595.3 x 841.9 pt).
page.drawRectangle({ x: 27.84, y: 342.69, width: 255.36, height: 24, color: white });
page.drawRectangle({ x: 312.48, y: 342.69, width: 255.36, height: 24, color: white });
fs.writeFileSync(outPdfPath, await pdfDoc.save());

console.log("Generated templates/ficha-graduacao-base.pdf");
