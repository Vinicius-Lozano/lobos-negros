"use client";

import { useEffect, useRef, useState } from "react";

// Desenha cada página do PDF num <canvas> com o pdf.js.
// Usar <iframe> não serve: o Chrome do Android não mostra PDF dentro da página.
export function PdfPreview({ data }: { data: ArrayBuffer }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        // O pdf.js transfere o buffer para o worker; passar uma cópia mantém o original.
        const doc = await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
        if (cancelado) return;
        container.replaceChildren();

        const largura = container.clientWidth || 600;
        const dpr = window.devicePixelRatio || 1;

        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelado) return;
          const escala = largura / page.getViewport({ scale: 1 }).width;
          const viewport = page.getViewport({ scale: escala * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.className = "pdf-page";
          container.appendChild(canvas);

          await page.render({ canvas, viewport }).promise;
        }
      } catch (err) {
        console.error("Erro ao mostrar a prévia do PDF:", err);
        if (!cancelado) setErro(true);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [data]);

  if (erro) {
    return (
      <p className="ticket-hint">
        Não foi possível mostrar a ficha aqui. Use o link &quot;Abrir o PDF&quot; abaixo para conferir.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="pdf-preview">
      <p className="ticket-hint">Carregando a ficha...</p>
    </div>
  );
}
