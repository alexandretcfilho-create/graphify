/**
 * CSV no padrão brasileiro (ponto e vírgula, vírgula decimal, datas dd/mm/aaaa),
 * que o Google Planilhas em pt-BR abre/cola direto nas abas.
 */
export function numBR(n: number | null | undefined, casas?: number): string {
  if (n == null || Number.isNaN(n)) return '';
  const s = casas != null ? n.toFixed(casas) : String(n);
  return s.replace('.', ',');
}

export function celula(v: string): string {
  return /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function gerarCSV(cabecalho: string[], linhas: string[][]): string {
  const corpo = [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n');
  return '﻿' + corpo + '\r\n'; // BOM: acentos corretos no Excel/Numbers
}

/** Pace em min/km formatado mm:ss. */
export function pace(distanciaKm: number | null, tempoMin: number | null): string {
  if (!distanciaKm || !tempoMin || distanciaKm <= 0) return '';
  const total = Math.round((tempoMin / distanciaKm) * 60);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
