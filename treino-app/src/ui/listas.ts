import { alertasCorrida, alertasEvolucao } from '../logic/alertas';
import { janelaDoCheckin, resumoParaCheckin } from '../logic/checkin';
import { apagar, estado, upsert } from '../store';
import { TABELAS } from '../tabelas';
import type { StoreName, Tabelas } from '../types';
import { cabecalho, h, toast } from './dom';
import { formulario } from './formulario';

const ROTA_VOLTA: Record<StoreName, string> = {
  registros: '#/mais/historico',
  corridas: '#/corrida',
  checkins: '#/checkin',
  fisio: '#/mais/fisio',
  evolucao: '#/quadro',
  composicao: '#/mais/composicao',
};

/** Lista de registros de uma aba, mais recentes primeiro. */
export function lista<K extends StoreName>(store: K, opcoes: { voltar?: string; topo?: Node[]; titulo?: string } = {}): HTMLElement {
  const t = TABELAS[store];
  const itens = [...(estado.dados[store] as Tabelas[K][])].sort((a, b) => {
    const da = String((a as unknown as { data?: string }).data ?? '');
    const dbb = String((b as unknown as { data?: string }).data ?? '');
    return dbb.localeCompare(da) || b.criadoEm - a.criadoEm;
  });
  return h(
    'section',
    { class: 'tela' },
    cabecalho(opcoes.titulo ?? t.titulo, opcoes.voltar, h('a', { class: 'btn mini primario', href: `#/editar/${store}/novo` }, '+ Novo')),
    opcoes.topo ?? [],
    itens.length
      ? h(
          'ul',
          { class: 'lista' },
          itens.map((r) => h('li', null, h('a', { href: `#/editar/${store}/${r.id}` }, t.resumo(r as never)))),
        )
      : h('p', { class: 'vazio' }, 'Nada registrado ainda.'),
  );
}

/** Tela de edição/criação de um registro. */
export function editar(store: StoreName, id: string, ir: (rota: string) => void): HTMLElement {
  const t = TABELAS[store];
  const existente = (estado.dados[store] as { id: string }[]).find((x) => x.id === id);
  const item = (existente ? structuredClone(existente) : t.novo()) as Tabelas[typeof store];

  if (!existente && store === 'checkins') {
    const c = item as Tabelas['checkins'];
    const j = janelaDoCheckin(c.data, c.semana, estado.dados.checkins);
    Object.assign(c, resumoParaCheckin(j, estado.dados.registros, estado.dados.corridas, estado.dados.fisio));
  }

  const voltar = ROTA_VOLTA[store];
  const form = formulario(
    t as never,
    item as never,
    async (salvo: Tabelas[StoreName]) => {
      await upsert(store, salvo as never);
      const alertas =
        store === 'evolucao' ? alertasEvolucao(salvo as Tabelas['evolucao'])
        : store === 'corridas' ? alertasCorrida(salvo as Tabelas['corridas'])
        : [];
      if (alertas.length) window.alert(alertas.map((a) => a.texto).join('\n\n'));
      else toast('Salvo');
      ir(voltar);
    },
    existente
      ? async () => {
          if (!window.confirm('Apagar este registro?')) return;
          await apagar(store, id);
          toast('Apagado');
          ir(voltar);
        }
      : undefined,
  );
  return h(
    'section',
    { class: 'tela' },
    cabecalho(existente ? `Editar — ${t.titulo}` : `Novo — ${t.titulo}`, voltar),
    store === 'checkins' && !existente
      ? h('p', { class: 'mudo' }, 'Treinos, core, corrida, fisio e cargas foram preenchidos com o que está registrado no app desde o último check-in. Confira antes de salvar.')
      : null,
    form,
  );
}
