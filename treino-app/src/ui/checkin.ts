import { CRONOGRAMA, FIM_DE_FASE, TESTES_PASSAGEM } from '../data/plano';
import { janelaDoCheckin, textoCheckin } from '../logic/checkin';
import { hojeISO } from '../logic/datas';
import { estado, salvarConfig } from '../store';
import { caixaAlerta, h, toast } from './dom';
import { lista } from './listas';

async function mudarSemana(para: number, motivo: string): Promise<void> {
  const de = estado.config.semanaAtual;
  await salvarConfig({
    semanaAtual: para,
    historicoSemana: [...estado.config.historicoSemana, { data: hojeISO(), de, para, motivo }],
  });
}

function blocoTestes(fase: 1 | 2 | 3, recarregar: () => void): HTMLElement {
  const reg = estado.config.testes[String(fase)] ?? { respostas: {} };
  return h(
    'div',
    { class: 'cartao' },
    h('h3', null, fase === 3 ? 'Testes de passagem — fim do ciclo' : `Testes de passagem — Fase ${fase} → ${fase + 1}`),
    h('p', { class: 'mudo' }, 'Só avance com todos os itens em Sim.'),
    TESTES_PASSAGEM.map((crit) =>
      h(
        'label',
        { class: 'check' },
        h('input', {
          type: 'checkbox',
          checked: !!reg.respostas[crit],
          onchange: async (e: Event) => {
            const respostas = { ...reg.respostas, [crit]: (e.target as HTMLInputElement).checked };
            await salvarConfig({ testes: { ...estado.config.testes, [String(fase)]: { respostas, data: hojeISO() } } });
            recarregar();
          },
        }),
        h('span', null, crit),
      ),
    ),
  );
}

export function telaCheckin(recarregar: () => void): HTMLElement {
  const sem = estado.config.semanaAtual;
  const daSemana = estado.dados.checkins.filter((c) => c.semana === sem).sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm - a.criadoEm);
  const ultimo = daSemana[0];
  const fase = FIM_DE_FASE[sem];
  const testesOk = fase ? TESTES_PASSAGEM.every((t) => estado.config.testes[String(fase)]?.respostas[t]) : true;

  const status: Node[] = [];
  if (!ultimo) {
    status.push(h('p', null, 'Ainda sem check-in desta semana. Preencha no domingo e cole no chat para o feedback.'));
  } else if (!ultimo.cor) {
    status.push(h('p', null, 'Check-in feito. Depois do feedback, registre a cor da semana e a decisão (toque no check-in para editar).'));
  } else if (ultimo.cor === 'verde') {
    if (sem >= 12) status.push(caixaAlerta('info', 'Semana 12 verde: fim do ciclo. Combine o próximo ciclo com a equipe.'));
    else if (!testesOk) status.push(caixaAlerta('atencao', 'Semana verde, mas os testes de passagem da fase ainda não estão todos em Sim.'));
    else
      status.push(
        h(
          'button',
          {
            class: 'btn primario grande',
            onclick: async () => {
              if (!window.confirm(`Avançar para a semana ${sem + 1}? A progressão vale a partir de agora.`)) return;
              await mudarSemana(sem + 1, 'Semana verde');
              toast(`Semana ${sem + 1} em execução`);
              recarregar();
            },
          },
          `Semana verde — avançar para a semana ${sem + 1}`,
        ),
      );
  } else if (ultimo.cor === 'amarelo') {
    status.push(caixaAlerta('atencao', 'Semana amarela: repetir a semana com volume −30 a 50% (com 5 treinos por semana, primeiro tirar 1 dia).'));
  } else {
    const faseAtual = CRONOGRAMA[sem - 1]!.fase;
    const alvo = faseAtual === 1 ? 1 : faseAtual === 2 ? 1 : 5;
    status.push(
      caixaAlerta('emergencia', 'Semana vermelha: parar, voltar uma fase e falar com o cirurgião.'),
      h(
        'button',
        {
          class: 'btn perigo',
          onclick: async () => {
            if (!window.confirm(`Voltar para a semana ${alvo} (início da fase anterior)?`)) return;
            await mudarSemana(alvo, 'Semana vermelha');
            recarregar();
          },
        },
        `Recuar para a semana ${alvo}`,
      ),
    );
  }

  const copiar = ultimo
    ? h(
        'button',
        {
          class: 'btn',
          onclick: async () => {
            const j = janelaDoCheckin(ultimo.data, ultimo.semana, estado.dados.checkins, ultimo.id);
            const txt = textoCheckin(ultimo, estado.dados.corridas, j);
            try {
              await navigator.clipboard.writeText(txt);
              toast('Check-in copiado. Cole no chat do projeto.');
            } catch {
              window.prompt('Copie o texto:', txt);
            }
          },
        },
        'Copiar check-in para o chat',
      )
    : null;

  return lista('checkins', {
    titulo: 'Check-in semanal',
    topo: [
      h('div', { class: 'cartao' }, h('h3', null, `Semana ${sem} em execução`), status, copiar),
      fase ? blocoTestes(fase, recarregar) : h('span'),
    ],
  });
}
