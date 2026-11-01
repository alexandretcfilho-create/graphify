import * as db from './db';
import { slug } from './data/plano';
import { gerarCSV } from './logic/csv';
import { hojeISO } from './logic/datas';
import { CONFIG_PADRAO, carregar, estado, salvarConfig } from './store';
import { TABELAS, linhasCSV } from './tabelas';
import { STORES, type Backup, type StoreName } from './types';

export function montarBackup(): Backup {
  return {
    app: 'treino',
    versao: 1,
    exportadoEm: new Date().toISOString(),
    configuracoes: estado.config,
    dados: estado.dados,
  };
}

export function nomeBackup(d = hojeISO()): string {
  return `treino-backup-${d}.json`;
}

/**
 * Um CSV por aba. `apenasNovos`: só o que foi criado/alterado desde o último
 * export (é o que precisa ser lançado na planilha).
 */
export function montarCSVs(apenasNovos: boolean): File[] {
  const corte = apenasNovos ? estado.config.ultimoExport : 0;
  const d = hojeISO();
  const arquivos: File[] = [];
  for (const s of STORES) {
    const t = TABELAS[s];
    const itens = (estado.dados[s] as { atualizadoEm: number }[]).filter((r) => r.atualizadoEm > corte);
    if (!itens.length) continue;
    const { cab, linhas } = linhasCSV(t as never, itens as never);
    arquivos.push(new File([gerarCSV(cab, linhas)], `treino-${slug(t.aba)}-${d}.csv`, { type: 'text/csv' }));
  }
  return arquivos;
}

export function arquivoBackup(): File {
  return new File([JSON.stringify(montarBackup(), null, 2)], nomeBackup(), { type: 'application/json' });
}

function baixar(f: File): void {
  const url = URL.createObjectURL(f);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ResultadoEnvio = 'compartilhado' | 'baixado' | 'cancelado';

/**
 * No iPhone abre o menu Compartilhar: escolha "Drive" (app do Google Drive)
 * ou "Salvar em Arquivos" › Google Drive › Treinamento.
 */
export async function compartilhar(arquivos: File[]): Promise<ResultadoEnvio> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: arquivos })) {
    try {
      await nav.share({ files: arquivos, title: 'Treino — backup' });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado';
      throw e;
    }
    await salvarConfig({ ultimoExport: Date.now() });
    return 'compartilhado';
  }
  for (const f of arquivos) baixar(f);
  await salvarConfig({ ultimoExport: Date.now() });
  return 'baixado';
}

export function validarBackup(obj: unknown): obj is Backup {
  if (!obj || typeof obj !== 'object') return false;
  const b = obj as Partial<Backup>;
  return b.app === 'treino' && b.versao === 1 && !!b.dados && typeof b.dados === 'object' && !!b.configuracoes;
}

/** Restaura um treino-backup-*.json (substitui os dados do aparelho). */
export async function restaurar(texto: string): Promise<void> {
  const obj: unknown = JSON.parse(texto);
  if (!validarBackup(obj)) throw new Error('Arquivo não é um backup do app Treino.');
  const dados = {} as Backup['dados'];
  for (const s of STORES) (dados as Record<StoreName, unknown[]>)[s] = Array.isArray(obj.dados[s]) ? obj.dados[s] : [];
  await db.substituirTudo(dados, { config: { ...CONFIG_PADRAO, ...obj.configuracoes } });
  await carregar();
}
