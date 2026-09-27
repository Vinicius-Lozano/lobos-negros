import nodemailer from "nodemailer";
import type { FichaInput } from "./ficha";

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER / SMTP_PASS não configurados.");
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function nomeParaArquivo(nomeCompleto: string): string {
  return nomeCompleto
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export async function enviarFichaPorEmail(data: FichaInput, pdfBuffer: Buffer) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM_EMAIL || `Associação Lobos Negros <${process.env.SMTP_USER}>`;
  const primeiroNome = data.nomeCompleto.trim().split(/\s+/)[0];

  await transporter.sendMail({
    from,
    to: data.email,
    subject: "Sua ficha de graduação — Associação Lobos Negros",
    html: `
      <div style="font-family: Arial, sans-serif; color: #201a15; max-width: 480px; margin: 0 auto;">
        <p>Olá, ${primeiroNome}!</p>
        <p>Recebemos sua ficha de graduação da <strong>Associação Lobos Negros de Artes Marciais</strong>. Ela segue anexada em anexo neste e-mail, já preenchida com os dados enviados.</p>
        <p>Guarde este e-mail e leve a ficha impressa ou o arquivo anexado no dia da graduação.</p>
        <p style="margin-top: 24px;">Lobos Negros de Artes Marciais</p>
      </div>
    `,
    attachments: [
      {
        filename: `Ficha_de_Graduacao_${nomeParaArquivo(data.nomeCompleto)}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
