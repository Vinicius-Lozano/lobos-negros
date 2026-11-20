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

const root = path.join(import.meta.dirname, "..");
const templatePath = path.join(root, "templates", "ficha-graduacao.docx");
const outDir = path.join(root, "templates");
const blankDocxPath = path.join(outDir, "ficha-graduacao-base.docx");

const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);

// The source .docx has "Bruno Wilson Franklin Vale da Silva" / "LOBOS NEGROS" as
// static (non-templated) text, badly vertically aligned in its table cell — it prints
// over the field's underline. There's no template tag for it, so we strip that text from
// the XML in memory (the original .docx stays untouched). The cards keep their original
// borders and underline, and lib/pdf.ts draws both values above the line like any field.
const documentXml = zip.file("word/document.xml").asText();
const strippedXml = documentXml
  .replace(">Bruno Wilson Franklin Vale da Silva<", "><")
  .replace(">LOBOS NEGROS<", "><");
if (strippedXml === documentXml) {
  throw new Error("Static Professor/Equipe text not found in the .docx — check the template.");
}
zip.file("word/document.xml", strippedXml);

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

console.log("Generated templates/ficha-graduacao-base.pdf");
