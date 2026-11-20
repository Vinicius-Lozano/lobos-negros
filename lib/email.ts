import nodemailer from "nodemailer";
import { nomeArquivoFicha, type FichaInput } from "./ficha";

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

export async function enviarFichaPorEmail(data: FichaInput, pdfBuffer: Buffer) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM_EMAIL || `Associação Lobos Negros <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to: data.email,
    subject: "Sua ficha de graduação — Associação Lobos Negros",
    html: `
      <div style="font-family: Arial, sans-serif; color: #201a15; max-width: 480px; margin: 0 auto;">
        <p>Aqui está a sua ficha.</p>
      </div>
    `,
    attachments: [
      {
        filename: nomeArquivoFicha(data.nomeCompleto),
        content: pdfBuffer,
      },
    ],
  });
}
