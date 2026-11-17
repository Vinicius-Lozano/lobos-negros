import { NextResponse } from "next/server";
import { validateFicha, type FichaInput } from "@/lib/ficha";
import { gerarFichaPdf } from "@/lib/pdf";

// Gera o PDF da ficha só para o aluno conferir. Não envia e-mail nem grava na planilha.
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

  try {
    const pdf = await gerarFichaPdf(body as FichaInput);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="ficha-previa.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erro ao gerar a prévia da ficha:", err);
    return NextResponse.json(
      { error: "Não foi possível gerar o arquivo da ficha." },
      { status: 500 }
    );
  }
}
