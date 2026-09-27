"use client";

import { useState, type FormEvent } from "react";
import { PROFESSOR_RESPONSAVEL, EQUIPE, GRADUACAO_OPTIONS, validateFicha, type FichaInput } from "@/lib/ficha";

type Status = "idle" | "sending" | "sent" | "error";

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
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof FichaInput>(field: K, value: FichaInput[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors = validateFicha(data);
    if (errors.length > 0) {
      setStatus("error");
      setMessage(errors[0].message);
      scrollToField(errors[0].field);
      return;
    }

    setStatus("sending");
    setMessage(null);

    try {
      const res = await fetch("/api/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.field) scrollToField(body.field);
        throw new Error(body.error || "Falha ao enviar a ficha.");
      }

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Falha ao enviar a ficha.");
    }
  }

  if (status === "sent") {
    return (
      <div className="ticket-card ticket-stamp">
        <div className="stamp-mark">ENVIADA</div>
        <h2 className="stamp-title">Ficha enviada</h2>
        <p className="stamp-text">
          Sua ficha de graduação foi preenchida e enviada para{" "}
          <strong>{data.email}</strong>. Confira sua caixa de entrada (e o spam).
        </p>
        <button
          type="button"
          className="ticket-button ticket-button--ghost"
          onClick={() => {
            setData(EMPTY);
            setStatus("idle");
          }}
        >
          Preencher outra ficha
        </button>
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
            type="date"
            value={data.dataNascimento}
            onChange={(e) => update("dataNascimento", e.target.value)}
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
          type="date"
          value={data.ultimaGraduacao}
          onChange={(e) => update("ultimaGraduacao", e.target.value)}
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

      <button type="submit" className="ticket-button" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Enviar ficha"}
      </button>
    </form>
  );
}
