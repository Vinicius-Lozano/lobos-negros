import { NextResponse } from "next/server";
import { validateFicha, type FichaInput } from "@/lib/ficha";
import { gerarFichaPdf } from "@/lib/pdf";
import { enviarFichaPorEmail } from "@/lib/email";
import { salvarNaPlanilha } from "@/lib/sheets";

export async function POST(request: Request) {
  let body: Partial<FichaInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const errors = validateFicha(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: errors.map((e) => e.message).join(" "), field: errors[0].field },
      { status: 400 }
    );
  }

  const data = body as FichaInput;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await gerarFichaPdf(data);
  } catch (err) {
    console.error("Erro ao gerar o documento da ficha:", err);
    return NextResponse.json(
      { error: "Não foi possível gerar o arquivo da ficha." },
      { status: 500 }
    );
  }

  try {
    await enviarFichaPorEmail(data, pdfBuffer);
  } catch (err) {
    console.error("Erro ao enviar o e-mail:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail. Verifique o endereço informado e tente novamente." },
      { status: 502 }
    );
  }

  try {
    await salvarNaPlanilha(data);
  } catch (err) {
    console.error("Erro ao salvar na planilha (e-mail já foi enviado):", err);
  }

  return NextResponse.json({ ok: true });
}
