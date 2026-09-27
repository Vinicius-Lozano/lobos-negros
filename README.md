# Ficha de Graduação — Associação Lobos Negros de Artes Marciais

Site com formulário para os alunos preencherem a ficha de graduação. Ao enviar:

1. O formulário preenche a ficha oficial (o mesmo layout do `.docx` original) com os dados digitados, gerando um **PDF**.
2. O PDF gerado é enviado por e-mail **para o próprio aluno** (o e-mail que ele digitou no formulário).
3. Os dados também são salvos como uma nova linha em uma planilha do Google Sheets (opcional, veja abaixo).

Stack: Next.js (App Router) + `pdf-lib` (preenchimento do PDF) + `Nodemailer` via SMTP (envio de e-mail, hoje usando Gmail) + `googleapis` (Google Sheets). Tudo gratuito, e tudo roda em funções serverless (compatível com Vercel) — sem depender de nenhum binário instalado no servidor.

### Por que PDF e não `.docx`?

A ideia original era preencher o `.docx` a cada envio, mas isso exige o LibreOffice para virar PDF — e a Vercel (hospedagem serverless gratuita) não tem esse binário disponível. A solução: o `.docx` original foi convertido **uma única vez** para um PDF "em branco" (`templates/ficha-graduacao-base.pdf`), e a cada envio o código usa `pdf-lib` (JavaScript puro, sem binários) para escrever os dados por cima, nas posições exatas das linhas do formulário. Resultado: o mesmo layout exato do documento oficial, funcionando de graça em qualquer hospedagem serverless.

Se um dia o `.docx` original mudar, rode `node scripts/generate-base-pdf.mjs` (exige LibreOffice instalado *na sua máquina*, não no servidor) para gerar um novo `ficha-graduacao-base.pdf`, e reconfira as coordenadas em `lib/pdf.ts`.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis, veja abaixo
npm run dev
```

Abra http://localhost:3000.

## Configurar o envio de e-mail (Gmail, gratuito)

O envio usa SMTP genérico (via Nodemailer), então funciona pra qualquer aluno desde o primeiro envio — sem precisar verificar domínio nenhum. Hoje está configurado para o Gmail:

1. Na conta Gmail que vai enviar os e-mails (pode ser uma conta dedicada da academia), ative a **verificação em duas etapas** em https://myaccount.google.com/security (é pré-requisito para gerar senha de app).
2. Gere uma **senha de app** em https://myaccount.google.com/apppasswords — escolha um nome qualquer (ex: "Ficha Lobos Negros") e copie a senha gerada (16 caracteres, sem espaços).
3. No `.env.local` (e depois nas variáveis de ambiente da Vercel), preencha:
   - `SMTP_USER`: o e-mail Gmail completo (ex: `contato@gmail.com`).
   - `SMTP_PASS`: a senha de app gerada (não é a senha normal da conta).
   - `SMTP_FROM_EMAIL` (opcional): como o remetente aparece, ex: `"Associação Lobos Negros <contato@gmail.com>"`.

O Gmail tem um limite de ~500 e-mails/dia numa conta pessoal, bem acima do volume esperado.

### Trocando de provedor de e-mail depois

Se um dia quiser trocar (por um domínio próprio verificado no Resend, Outlook, um SMTP de hospedagem, etc.), não precisa mexer no código — só trocar as variáveis `SMTP_HOST` e `SMTP_PORT` (deixe em branco para usar o Gmail) e as credenciais em `SMTP_USER`/`SMTP_PASS`. O arquivo `lib/email.ts` é genérico para qualquer servidor SMTP.

## Configurar o Google Sheets (opcional, gratuito)

Isso é opcional: sem essas variáveis configuradas, o site continua funcionando normalmente (gera o PDF e manda o e-mail), só não grava na planilha.

1. Acesse https://console.cloud.google.com/ e crie um projeto (ou use um existente).
2. Ative a **Google Sheets API** (menu "APIs e serviços" → "Ativar APIs e serviços" → busque "Google Sheets API" → Ativar).
3. Crie uma **conta de serviço**: "APIs e serviços" → "Credenciais" → "Criar credenciais" → "Conta de serviço". Dê um nome qualquer (ex: `lobos-negros-sheets`) e conclua.
4. Na conta de serviço criada, vá em "Chaves" → "Adicionar chave" → "Criar nova chave" → formato **JSON**. Isso baixa um arquivo `.json` — guarde-o, ele não pode ser baixado de novo.
5. Abra sua planilha do Google Sheets e clique em "Compartilhar". Compartilhe com o e-mail da conta de serviço (algo como `lobos-negros-sheets@SEU-PROJETO.iam.gserviceaccount.com`, encontrado no arquivo JSON como `client_email`), com permissão de **Editor**.
6. No `.env.local` (e depois na Vercel), preencha:
   - `GOOGLE_SHEET_ID`: o ID da planilha, que fica na URL entre `/d/` e `/edit`: `https://docs.google.com/spreadsheets/d/ESTE_TRECHO_AQUI/edit`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: o `client_email` do JSON.
   - `GOOGLE_PRIVATE_KEY`: o `private_key` do JSON, colado **exatamente como está** (com as quebras de linha como `\n`).

Cada envio de formulário adiciona uma linha na planilha com: data/hora, nome, data de nascimento, telefone, e-mail, graduação atual e última graduação.

## Deploy gratuito na Vercel

1. Suba este repositório no GitHub.
2. Em https://vercel.com, importe o repositório (login com GitHub, grátis).
3. Em "Environment Variables", adicione as mesmas variáveis do `.env.local` (`SMTP_USER`, `SMTP_PASS` e, se for usar, as três variáveis do Google Sheets).
4. Deploy. Toda vez que você der push no GitHub, a Vercel publica automaticamente a nova versão na mesma URL `.vercel.app`.

## Estrutura

- `app/page.tsx` — página com o formulário.
- `app/components/FichaForm.tsx` — formulário (client component).
- `app/api/enviar/route.ts` — recebe os dados, gera o PDF, envia o e-mail e grava na planilha.
- `lib/pdf.ts` — escreve os dados por cima do PDF-base, nas coordenadas de cada linha do formulário.
- `lib/email.ts` — envia o e-mail via SMTP (Nodemailer), hoje configurado para o Gmail.
- `lib/sheets.ts` — grava a linha no Google Sheets.
- `templates/ficha-graduacao.docx` — o documento .docx original, mantido como referência/fonte da ficha.
- `templates/ficha-graduacao-base.pdf` — versão em PDF do documento, com os campos em branco; é nele que `lib/pdf.ts` escreve a cada envio.
- `scripts/generate-base-pdf.mjs` — regenera o `ficha-graduacao-base.pdf` a partir do `.docx`, caso o template mude (exige LibreOffice local).
