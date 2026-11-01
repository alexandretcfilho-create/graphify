import { ADIADOS, CRONOGRAMA, LEMBRETES_GERAIS, TREINOS } from '../data/plano';
import { TEXTO_CIRURGIAO, TEXTO_EMERGENCIA } from '../logic/alertas';
import { ultimaCarga } from '../logic/cargas';
import { brCurto, isoParaBR } from '../logic/datas';
import { arquivoBackup, compartilhar, montarCSVs, nomeBackup, restaurar } from '../exportar';
import { estado, exercicios, salvarConfig } from '../store';
import { STORES, type GrupoTreino, type TreinoLetra } from '../types';
import * as db from '../db';
import { caixaAlerta, cabecalho, fmtNum, h, lerNumero, toast } from './dom';
import { infoCarga } from './hoje';

export function telaMais(): HTMLElement {
  const item = (href: string, titulo: string, sub: string) =>
    h('li', null, h('a', { href }, h('strong', null, titulo), h('small', null, sub)));
  return h(
    'section',
    { class: 'tela' },
    cabecalho('Mais'),
    h(
      'ul',
      { class: 'menu' },
      item('#/mais/backup', 'Backup e Google Drive', 'Exportar JSON + CSV pelo menu Compartilhar'),
      item('#/mais/cargas', 'Cargas', 'Pré-op, teto da semana e carga atual'),
      item('#/mais/plano', 'Plano de 12 semanas', 'Cronograma, adiados e regras'),
      item('#/mais/historico', 'Registro de treinos', 'Tudo que foi salvo, editável'),
      item('#/mais/fisio', 'Fisioterapia', 'Sessões, abdominal prescrito, orientações'),
      item('#/mais/composicao', 'Composição corporal', 'Bioimpedância (InBody)'),
      item('#/mais/ajustes', 'Ajustes', 'Semana do plano, rodízio, apagar dados'),
    ),
  );
}

export function telaCargas(recarregar: () => void): HTMLElement {
  const sem = estado.config.semanaAtual;
  const grupos: GrupoTreino[] = ['A', 'B', 'C'];
  return h(
    'section',
    { class: 'tela' },
    cabecalho('Cargas', '#/mais'),
    h('p', { class: 'mudo' }, `Teto da semana ${sem}: ${CRONOGRAMA[sem - 1]!.pct}% da pré-op, arredondado para baixo em 2,5 kg. Carga axial/livre começa do zero.`),
    grupos.map((g) =>
      h(
        'div',
        { class: 'cartao' },
        h('h3', null, `${g} — ${TREINOS[g].titulo}`),
        exercicios()
          .filter((e) => e.treino === g)
          .map((ex) => {
            const info = infoCarga(ex);
            const ult = ultimaCarga(ex.id, estado.dados.registros);
            const aj = estado.config.ajustes[ex.id] ?? {};
            const pre = h('input', {
              type: 'text', inputMode: 'decimal', class: 'curto',
              value: fmtNum(aj.preOpKg ?? ex.preOpKg), placeholder: 'kg',
              onchange: async (e: Event) => {
                const v = lerNumero((e.target as HTMLInputElement).value);
                await salvarConfig({ ajustes: { ...estado.config.ajustes, [ex.id]: { ...aj, preOpKg: v } } });
                toast('Pré-op salva');
                recarregar();
              },
            });
            const pct = info.preOp && ult?.cargaKg ? Math.round((ult.cargaKg / info.preOp) * 100) : null;
            return h(
              'div',
              { class: 'linha-carga' + (ex.suspenso ? ' suspenso' : '') },
              h('div', null, h('strong', null, ex.nome), h('small', null, info.texto), pct != null ? h('small', { class: pct > 100 ? 'erro' : '' }, `Atual/pré-op: ${pct}%`) : null),
              ex.tipo === 'apoiada' ? h('label', { class: 'mini-campo' }, h('span', null, 'Pré-op'), pre) : null,
              h(
                'label',
                { class: 'check mini' },
                h('input', {
                  type: 'checkbox',
                  checked: !!ex.suspenso,
                  onchange: async (e: Event) => {
                    const v = (e.target as HTMLInputElement).checked;
                    if (!v && !window.confirm('Reativar só com liberação da fisioterapia/cirurgião. Confirmar?')) {
                      (e.target as HTMLInputElement).checked = true;
                      return;
                    }
                    await salvarConfig({ ajustes: { ...estado.config.ajustes, [ex.id]: { ...aj, suspenso: v } } });
                    recarregar();
                  },
                }),
                h('span', null, 'Suspenso'),
              ),
            );
          }),
      ),
    ),
  );
}

export function telaPlano(): HTMLElement {
  const sem = estado.config.semanaAtual;
  return h(
    'section',
    { class: 'tela' },
    cabecalho('Plano de 12 semanas', '#/mais'),
    caixaAlerta('emergencia', TEXTO_EMERGENCIA),
    caixaAlerta('cirurgiao', TEXTO_CIRURGIAO),
    h(
      'div',
      { class: 'tabela-rolagem' },
      h(
        'table',
        { class: 'tabela' },
        h('thead', null, h('tr', null, ['Sem.', 'Datas', 'Fase', '%', 'RIR', 'Séries × reps', 'Aeróbico'].map((c) => h('th', null, c)))),
        h(
          'tbody',
          null,
          CRONOGRAMA.map((s) =>
            h(
              'tr',
              { class: s.semana === sem ? 'atual' : '' },
              h('td', null, s.semana),
              h('td', null, `${brCurto(s.inicio)}–${brCurto(s.fim)}`),
              h('td', null, s.fase),
              h('td', null, `${s.pct}%`),
              h('td', null, s.rir),
              h('td', null, `${s.series} × ${s.reps}`),
              h('td', null, s.aerobico + (s.obs ? ` — ${s.obs}` : '')),
            ),
          ),
        ),
      ),
    ),
    h('div', { class: 'cartao' }, h('h3', null, 'Regras'), h('ul', null, [
      '“50%” vale só para máquinas apoiadas e polias. Carga axial ou flexão com peso começa do zero.',
      'Progressão de no máximo 5–10% por semana por exercício, só após semana verde. Nunca acima da pré-op neste ciclo.',
      'Sem flexão lombar com carga, torção com carga ou impacto nas Fases 1–2.',
      'Prescrições do médico e da fisioterapia prevalecem sobre a ficha.',
      'Semáforo: verde = avançar; amarelo = repetir com volume −30–50%; vermelho = parar, voltar uma fase e falar com o cirurgião.',
      'Corrida no ritmo de conversa, sem meta de pace. Dor durante ou nas 24 h seguintes = voltar ao passo anterior.',
      ...LEMBRETES_GERAIS,
    ].map((r) => h('li', null, r)))),
    h('div', { class: 'cartao' }, h('h3', null, 'Exercícios e atividades adiados'), h('p', { class: 'mudo' }, 'Reintrodução só com a semana anterior verde e validação do cirurgião ou fisioterapeuta.'),
      h('ul', null, ADIADOS.map((a) => h('li', null, h('strong', null, a.item), ` — ${a.liberacao}. ${a.condicao}.`)))),
  );
}

export function telaBackup(recarregar: () => void): HTMLElement {
  const cfg = estado.config;
  const novos = STORES.reduce((s, k) => s + (estado.dados[k] as { atualizadoEm: number }[]).filter((r) => r.atualizadoEm > cfg.ultimoExport).length, 0);
  const total = STORES.reduce((s, k) => s + estado.dados[k].length, 0);
  const persist = h('small', { class: 'mudo' }, '');
  void navigator.storage?.persisted?.().then((p) => {
    persist.textContent = p ? 'Armazenamento persistente ativo.' : 'O iOS pode limpar dados de sites pouco usados: mantenha o app na Tela de Início e exporte toda semana.';
  });

  const enviar = async (arquivos: File[]) => {
    try {
      const r = await compartilhar(arquivos);
      if (r !== 'cancelado') toast(r === 'compartilhado' ? 'Enviado' : 'Arquivos baixados');
      recarregar();
    } catch (e) {
      window.alert('Não foi possível compartilhar: ' + (e as Error).message);
    }
  };

  const entradaArquivo = h('input', {
    type: 'file', accept: 'application/json,.json', class: 'oculto',
    onchange: async (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      if (!window.confirm(`Restaurar "${f.name}"? Os dados atuais do aparelho serão substituídos.`)) return;
      try {
        await restaurar(await f.text());
        toast('Backup restaurado');
        recarregar();
      } catch (err) {
        window.alert((err as Error).message);
      }
    },
  });

  return h(
    'section',
    { class: 'tela' },
    cabecalho('Backup e Google Drive', '#/mais'),
    h(
      'div',
      { class: 'cartao' },
      h('p', null, `${total} registros no aparelho · ${novos} novos desde o último envio`),
      h('p', { class: 'mudo' }, cfg.ultimoExport ? `Último envio: ${new Date(cfg.ultimoExport).toLocaleString('pt-BR')}` : 'Nenhum envio ainda.'),
      persist,
      h('button', { class: 'btn primario grande', onclick: () => void enviar([arquivoBackup(), ...montarCSVs(true)]) }, 'Enviar backup + CSVs novos'),
      h('div', { class: 'acoes' },
        h('button', { class: 'btn', onclick: () => void enviar([arquivoBackup()]) }, 'Só o backup JSON'),
        h('button', { class: 'btn', onclick: () => void enviar(montarCSVs(false)) }, 'CSVs com tudo'),
      ),
    ),
    h(
      'div',
      { class: 'cartao' },
      h('h3', null, 'Como salvar na pasta Treinamento do Drive'),
      h('ol', null,
        h('li', null, 'Toque em “Enviar backup + CSVs novos”.'),
        h('li', null, 'No menu Compartilhar, escolha “Drive” (app do Google Drive) e selecione a pasta Treinamento.'),
        h('li', null, 'Ou “Salvar em Arquivos” › Google Drive › Treinamento.'),
        h('li', null, `O backup se chama ${nomeBackup()}; os CSVs têm uma aba cada, no formato da planilha.`),
      ),
    ),
    h(
      'div',
      { class: 'cartao' },
      h('h3', null, 'Restaurar'),
      h('p', { class: 'mudo' }, 'Trocou de iPhone ou os dados sumiram? Abra o treino-backup-AAAA-MM-DD.json mais recente.'),
      entradaArquivo,
      h('button', { class: 'btn', onclick: () => entradaArquivo.click() }, 'Escolher arquivo de backup'),
    ),
  );
}

export function telaAjustes(recarregar: () => void): HTMLElement {
  const cfg = estado.config;
  const semana = h('select', null, CRONOGRAMA.map((s) => h('option', { value: String(s.semana), selected: s.semana === cfg.semanaAtual }, `Semana ${s.semana} (${isoParaBR(s.inicio)})`)));
  const prox = h('select', null, (['A', 'B', 'C'] as TreinoLetra[]).map((t) => h('option', { value: t, selected: t === cfg.proximoTreino }, `Treino ${t}`)));
  return h(
    'section',
    { class: 'tela' },
    cabecalho('Ajustes', '#/mais'),
    h(
      'div',
      { class: 'cartao' },
      h('label', { class: 'campo' }, h('span', null, 'Semana do plano em execução'), semana, h('small', null, 'Normalmente muda pelo botão do Check-in após semana verde. Use aqui só para corrigir.')),
      h('label', { class: 'campo' }, h('span', null, 'Próximo treino do rodízio'), prox),
      h('button', {
        class: 'btn primario',
        onclick: async () => {
          const s = Number(semana.value);
          const mudou = s !== cfg.semanaAtual;
          await salvarConfig({
            semanaAtual: s,
            proximoTreino: prox.value as TreinoLetra,
            historicoSemana: mudou ? [...cfg.historicoSemana, { data: new Date().toISOString().slice(0, 10), de: cfg.semanaAtual, para: s, motivo: 'Ajuste manual' }] : cfg.historicoSemana,
          });
          toast('Ajustes salvos');
          recarregar();
        },
      }, 'Salvar'),
    ),
    cfg.historicoSemana.length
      ? h('div', { class: 'cartao' }, h('h3', null, 'Histórico da semana do plano'),
          h('ul', null, cfg.historicoSemana.slice().reverse().map((x) => h('li', null, `${isoParaBR(x.data)}: ${x.de} → ${x.para} (${x.motivo})`))))
      : null,
    h(
      'div',
      { class: 'cartao' },
      h('h3', null, 'Apagar dados'),
      h('p', { class: 'mudo' }, 'Exporte o backup antes. Isto não tem volta.'),
      h('button', {
        class: 'btn perigo',
        onclick: async () => {
          if (!window.confirm('Apagar TODOS os registros deste aparelho?')) return;
          if (window.prompt('Digite APAGAR para confirmar') !== 'APAGAR') return;
          const vazio = Object.fromEntries(STORES.map((s) => [s, []])) as never;
          await db.substituirTudo(vazio, { config: undefined });
          location.reload();
        },
      }, 'Apagar tudo'),
    ),
  );
}
