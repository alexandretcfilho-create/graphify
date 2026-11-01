import * as db from './db';
import { EXERCICIOS } from './data/plano';
import { STORES, type Configuracoes, type Exercicio, type StoreName, type Tabelas } from './types';

export const CONFIG_PADRAO: Configuracoes = {
  // Valor da aba Cargas ("Semana do plano em execução"). Ajuste em Mais › Ajustes.
  semanaAtual: 1,
  proximoTreino: 'A',
  ajustes: {},
  testes: {},
  ultimoExport: 0,
  historicoSemana: [],
};

type Cache = { [K in StoreName]: Tabelas[K][] };

/** Estado em memória, carregado do IndexedDB na abertura do app. */
export const estado: { config: Configuracoes; dados: Cache } = {
  config: structuredClone(CONFIG_PADRAO),
  dados: { registros: [], corridas: [], checkins: [], fisio: [], evolucao: [], composicao: [] },
};

export async function carregar(): Promise<void> {
  const cfg = await db.lerMeta<Configuracoes>('config');
  estado.config = { ...structuredClone(CONFIG_PADRAO), ...(cfg ?? {}) };
  for (const s of STORES) {
    (estado.dados as Record<StoreName, unknown[]>)[s] = await db.listar(s);
  }
}

export async function salvarConfig(parcial: Partial<Configuracoes>): Promise<void> {
  estado.config = { ...estado.config, ...parcial };
  await db.gravarMeta('config', estado.config);
}

export function novoId(): string {
  return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`).toString();
}

export async function upsert<K extends StoreName>(store: K, item: Tabelas[K]): Promise<void> {
  item.atualizadoEm = Date.now();
  if (!item.criadoEm) item.criadoEm = item.atualizadoEm;
  await db.salvar(store, item);
  const lista = estado.dados[store] as Tabelas[K][];
  const i = lista.findIndex((x) => x.id === item.id);
  if (i >= 0) lista[i] = item;
  else lista.push(item);
}

export async function apagar(store: StoreName, id: string): Promise<void> {
  await db.remover(store, id);
  const lista = estado.dados[store] as { id: string }[];
  const i = lista.findIndex((x) => x.id === id);
  if (i >= 0) lista.splice(i, 1);
}

/** Exercícios da ficha com os ajustes feitos no app (pré-op, suspensão). */
export function exercicios(): Exercicio[] {
  return EXERCICIOS.map((ex) => {
    const aj = estado.config.ajustes[ex.id];
    return aj && aj.suspenso != null ? { ...ex, suspenso: aj.suspenso } : ex;
  });
}
