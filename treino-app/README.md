# Treino — PWA de acompanhamento do treino (iPhone)

App web progressivo (PWA) em **TypeScript + Vite**, sem framework. Depois de
instalado na Tela de Início do iPhone, abre como um app, **funciona offline** e
guarda tudo **no próprio aparelho** (IndexedDB). O envio para o Google Drive é
feito pelo menu **Compartilhar** do iOS.

Os dados do plano (ciclo de 12 semanas, rodízio A-B-C + core, cargas pré-op,
teto semanal, exercícios adiados e testes de passagem) vêm da planilha
*Retorno pós-cirúrgico — acompanhamento* e estão em `src/data/plano.ts`.
Nenhum dado clínico fica no código: anamnese, sintomas e exames só existem no
aparelho e nos backups que você enviar.

## O que o app faz

| Aba | Para quê |
| --- | --- |
| **Hoje** | Semana/fase do plano, % da pré-op, RIR, séries × reps e aeróbico da semana. Treino A, B, C ou Core com os exercícios liberados; mostra pré-op, **teto da semana** (arredondado para baixo em 2,5 kg) e última carga; avisa se a carga passar do teto ou da pré-op. Timer de descanso 60/90 s. “Concluir treino” avança o rodízio contínuo (depois do C vem o A). |
| **Corrida** | Caminhadas e trotes; pace calculado sozinho. Dor ou sintoma → aviso para voltar ao passo anterior. |
| **Check-in** | Check-in de domingo, já preenchido com treinos A/B/C, dias de core, corridas, km, fisio e cargas registradas desde o último check-in. Botão **Copiar check-in para o chat** (no modelo do projeto). Depois do feedback, registre cor e decisão: semana **verde** libera “Avançar semana” (nas semanas 4, 8 e 12 exige os testes de passagem); amarela orienta repetir; vermelha oferece recuar uma fase. |
| **Quadro** | Evolução do quadro. Sinais de emergência e de contato com o cirurgião disparam alerta na hora. |
| **Mais** | Backup e Drive, Cargas (pré-op editável, suspender/reativar exercício), Plano de 12 semanas e regras, Registro de treinos, Fisioterapia, Composição corporal, Ajustes. |

## Backup e Google Drive

*Mais › Backup e Google Drive › Enviar backup + CSVs novos* gera:

- `treino-backup-AAAA-MM-DD.json` — tudo (para restaurar ou para o chat ler);
- um CSV por aba **só com os registros novos** desde o último envio, com as
  mesmas colunas da planilha (`;`, vírgula decimal, datas dd/mm/aaaa).

No menu Compartilhar, escolha **Drive** › pasta *Treinamento* (ou *Salvar em
Arquivos* › Google Drive › Treinamento). Para restaurar em outro aparelho:
*Restaurar › Escolher arquivo de backup*.

> O Safari pode apagar dados de sites não usados por semanas. Com o app na Tela
> de Início isso é raro, mas envie o backup toda semana (no check-in).

## Desenvolvimento

```bash
cd treino-app
npm install
npm run dev        # servidor local
npm test           # testes da lógica (teto de carga, CSV, check-in, alertas)
npm run build      # gera dist/ (com service worker e lista de pré-cache)
npm run preview -- --host   # testar o build pela rede local
```

O service worker só funciona em `https://` ou `localhost`; para instalar no
iPhone, publique em HTTPS.

Estrutura:

```
src/
  data/plano.ts      plano de 12 semanas, exercícios, adiados, testes
  logic/             regras puras e testadas (cargas, rodízio, alertas, CSV, check-in)
  tabelas.ts         campos de cada aba (formulários e CSV saem daqui)
  db.ts / store.ts   IndexedDB e estado em memória
  exportar.ts        backup JSON, CSVs, Compartilhar, restaurar
  ui/                telas
  sw.ts              service worker (cache do app para uso offline)
```

Para mudar a ficha (novo exercício, pré-op, semana de liberação), edite
`src/data/plano.ts`. Pré-op e suspensão também podem ser ajustadas no app em
*Mais › Cargas*, sem mexer no código.

## Publicar e instalar no iPhone

1. No GitHub: *Settings › Pages › Source: GitHub Actions*.
2. *Actions › Treino app (GitHub Pages) › Run workflow*.
3. No iPhone, abra a URL no **Safari** › Compartilhar › **Adicionar à Tela de Início**.

Qualquer hospedagem HTTPS estática serve (Netlify, Vercel, Cloudflare Pages):
publique a pasta `dist/`.
