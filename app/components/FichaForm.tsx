"use client";

import { useState, type FormEvent } from "react";
import { PdfPreview } from "./PdfPreview";
import {
  PROFESSOR_RESPONSAVEL,
  EQUIPE,
  GRADUACAO_OPTIONS,
  nomeArquivoFicha,
  validateFicha,
  type FichaInput,
} from "@/lib/ficha";

// Etapas: preencher o formulário, conferir o PDF e, por fim, ficha enviada.
type Etapa = "form" | "preview" | "sent";
type Status = "idle" | "loading" | "error";

const EMPTY: FichaInput = {
  nomeCompleto: "",
  dataNascimento: "",
  telefone: "",
  email: "",
  graduacaoAtual: "",
  ultimaGraduacao: "",
};

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Datas são digitadas como DD/MM/AAAA (campo de texto com máscara, no máximo 8 números).
// O seletor nativo (type="date") deixava digitar anos de 6 dígitos no Firefox e em celulares.
function maskData(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// DD/MM/AAAA completo vira AAAA-MM-DD (formato da API e do PDF). Data incompleta passa
// como está e a validação recusa.
function dataParaISO(texto: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : texto;
}

function paraEnvio(data: FichaInput): FichaInput {
  return {
    ...data,
    dataNascimento: dataParaISO(data.dataNascimento),
    ultimaGraduacao: dataParaISO(data.ultimaGraduacao),
  };
}

function scrollToField(field: keyof FichaInput | string) {
  const id = field === "graduacaoAtual" ? "graduacaoAtual-field" : field;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (el instanceof HTMLInputElement) {
    el.focus({ preventScroll: true });
  }
}

export function FichaForm() {
  const [data, setData] = useState<FichaInput>(EMPTY);
  // Confirmação do e-mail: só existe no formulário, não vai para a ficha nem para a API.
  const [emailConfirmacao, setEmailConfirmacao] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pdf, setPdf] = useState<ArrayBuffer | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  function update<K extends keyof FichaInput>(field: K, value: FichaInput[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function limparPrevia() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdf(null);
    setPdfUrl(null);
  }

  // Passo 1: valida e gera o PDF para o aluno conferir. Nada é enviado ainda.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors = validateFicha(paraEnvio(data));
    if (errors.length > 0) {
      setStatus("error");
      setMessage(errors[0].message);
      scrollToField(errors[0].field);
      return;
    }

    if (emailConfirmacao.trim().toLowerCase() !== data.email.trim().toLowerCase()) {
      setStatus("error");
      setMessage("Os e-mails não são iguais. Digite o mesmo e-mail nos dois campos.");
      scrollToField("emailConfirmacao");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/previa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paraEnvio(data)),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.field) scrollToField(body.field);
        throw new Error(body.error || "Falha ao gerar a ficha.");
      }

      const bytes = await res.arrayBuffer();
      limparPrevia();
      setPdf(bytes);
      setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })));
      setStatus("idle");
      setEtapa("preview");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Falha ao gerar a ficha.");
    }
  }

  // Passo 2: o aluno conferiu o PDF e confirmou. Agora envia o e-mail e grava na planilha.
  async function handleEnviar() {
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paraEnvio(data)),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Falha ao enviar a ficha.");
      }

      // Mantém o PDF da prévia no navegador para o botão de download da tela final
      // (é o mesmo arquivo do e-mail; baixar não chama o servidor de novo).
      setStatus("idle");
      setEtapa("sent");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Falha ao enviar a ficha.");
    }
  }

  function voltarParaCorrigir() {
    limparPrevia();
    setStatus("idle");
    setMessage(null);
    setEtapa("form");
  }

  if (etapa === "sent") {
    return (
      <div className="ticket-card ticket-stamp">
        <div className="stamp-mark">ENVIADA</div>
        <h2 className="stamp-title">Ficha enviada</h2>
        <p className="stamp-text">
          Sua ficha de graduação foi preenchida e enviada para{" "}
          <strong>{data.email}</strong>. Confira sua caixa de entrada (e o spam).
        </p>
        {pdfUrl && (
          <a className="ticket-button" href={pdfUrl} download={nomeArquivoFicha(data.nomeCompleto)}>
            Baixar a ficha (PDF)
          </a>
        )}
        <button
          type="button"
          className="ticket-button ticket-button--ghost"
          onClick={() => {
            limparPrevia();
            setData(EMPTY);
            setEmailConfirmacao("");
            setEtapa("form");
          }}
        >
          Preencher outra ficha
        </button>
      </div>
    );
  }

  if (etapa === "preview" && pdf) {
    return (
      <div className="ticket-card">
        <h2 className="stamp-title">Confira sua ficha</h2>
        <p className="ticket-hint">
          Veja se todos os dados estão corretos. A ficha só será enviada para{" "}
          <strong>{data.email}</strong> depois que você clicar em &quot;Confirmar e enviar&quot;.
        </p>

        <PdfPreview data={pdf} />

        {pdfUrl && (
          <a className="ticket-hint" href={pdfUrl} target="_blank" rel="noopener noreferrer">
            Abrir o PDF em tela cheia
          </a>
        )}

        {status === "error" && message && <p className="ticket-error">{message}</p>}

        <div className="ticket-actions">
          <button
            type="button"
            className="ticket-button ticket-button--ghost"
            onClick={voltarParaCorrigir}
            disabled={status === "loading"}
          >
            Voltar e corrigir
          </button>
          <button
            type="button"
            className="ticket-button"
            onClick={handleEnviar}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Enviando..." : "Confirmar e enviar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="ticket-card" onSubmit={handleSubmit} noValidate>
      <div className="ticket-field">
        <label htmlFor="nomeCompleto">Nome completo, legível e sem abreviações</label>
        <input
          id="nomeCompleto"
          name="nomeCompleto"
          type="text"
          autoComplete="name"
          value={data.nomeCompleto}
          onChange={(e) => update("nomeCompleto", e.target.value)}
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div className="ticket-row">
        <div className="ticket-field">
          <label htmlFor="dataNascimento">Data de nascimento</label>
          <input
            id="dataNascimento"
            name="dataNascimento"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            value={data.dataNascimento}
            onChange={(e) => update("dataNascimento", maskData(e.target.value))}
            placeholder="DD/MM/AAAA"
            required
          />
        </div>
        <div className="ticket-field">
          <label htmlFor="telefone">Telefone</label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={data.telefone}
            onChange={(e) => update("telefone", maskTelefone(e.target.value))}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </div>

      <div className="ticket-field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="voce@exemplo.com"
          required
        />
        <p className="ticket-hint">Sua ficha preenchida será enviada para este e-mail.</p>
      </div>

      <div className="ticket-field">
        <label htmlFor="emailConfirmacao">Confirme o e-mail</label>
        <input
          id="emailConfirmacao"
          name="emailConfirmacao"
          type="email"
          autoComplete="off"
          value={emailConfirmacao}
          onChange={(e) => setEmailConfirmacao(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          placeholder="Digite o e-mail de novo"
          required
        />
        <p className="ticket-hint">Digite de novo, sem copiar e colar.</p>
      </div>

      <div className="ticket-field" id="graduacaoAtual-field">
        <span className="ticket-field-legend">Graduação atual</span>
        <div className="belt-grid" role="radiogroup" aria-label="Graduação atual">
          {GRADUACAO_OPTIONS.map((g) => (
            <label
              key={g.value}
              className={`belt-option${data.graduacaoAtual === g.value ? " belt-option--selected" : ""}`}
            >
              <input
                type="radio"
                name="graduacaoAtual"
                value={g.value}
                checked={data.graduacaoAtual === g.value}
                onChange={(e) => update("graduacaoAtual", e.target.value)}
                required
              />
              <span
                className="belt-bar"
                style={{
                  background:
                    g.cores.length === 2
                      ? `linear-gradient(90deg, ${g.cores[0]} 50%, ${g.cores[1]} 50%)`
                      : g.cores[0],
                }}
              />
              <span className="belt-label">{g.value.replace("Prajeid ", "")}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="ticket-field">
        <label htmlFor="ultimaGraduacao">Data da última graduação</label>
        <input
          id="ultimaGraduacao"
          name="ultimaGraduacao"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={data.ultimaGraduacao}
          onChange={(e) => update("ultimaGraduacao", maskData(e.target.value))}
          placeholder="DD/MM/AAAA"
        />
      </div>

      <div className="ticket-divider" role="presentation" />

      <div className="ticket-row ticket-row--stamped">
        <div className="ticket-stamped-field">
          <span className="ticket-stamped-label">Professor responsável</span>
          <span className="ticket-stamped-value">{PROFESSOR_RESPONSAVEL}</span>
        </div>
        <div className="ticket-stamped-field">
          <span className="ticket-stamped-label">Equipe</span>
          <span className="ticket-stamped-value">{EQUIPE}</span>
        </div>
      </div>

      {status === "error" && message && <p className="ticket-error">{message}</p>}

      <button type="submit" className="ticket-button" disabled={status === "loading"}>
        {status === "loading" ? "Gerando a ficha..." : "Conferir ficha"}
      </button>
    </form>
  );
}
