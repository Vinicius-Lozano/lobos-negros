import Image from "next/image";
import { FichaForm } from "./components/FichaForm";

export default function Home() {
  return (
    <main className="page">
      <div className="claw claw--top" aria-hidden="true">
        <Image src="/images/claw.png" alt="" fill sizes="600px" priority />
      </div>
      <div className="claw claw--bottom" aria-hidden="true">
        <Image src="/images/claw.png" alt="" fill sizes="600px" />
      </div>

      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image's srcset + CSS filter flattens this PNG's transparency in some browsers */}
        <img className="emblem" src="/images/logo.png" alt="Associação Lobos Negros de Artes Marciais" />
        <p className="hero-eyebrow">Associação Lobos Negros de Artes Marciais</p>
        <h1 className="hero-title">Ficha de Filiação</h1>
        <p className="hero-sub">
          Preencha seus dados abaixo. Sua ficha será gerada e enviada para o seu e-mail.
        </p>
      </section>

      <FichaForm />

      <footer className="page-footer">Associação Lobos Negros de Artes Marciais — Muay Thai</footer>
    </main>
  );
}
