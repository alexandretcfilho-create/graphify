/** Datas sempre em ISO local (yyyy-mm-dd), sem fuso. */
export function hojeISO(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 2026-10-12 -> 12/10/2026 (formato da planilha). */
export function isoParaBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function brCurto(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : iso;
}

/** Semana do calendário do plano em que a data cai (1..12) ou null fora do ciclo. */
export function semanaDoCalendario(iso: string, inicioCiclo: string, semanas = 12): number | null {
  const dia = 86_400_000;
  const a = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  const b = Date.UTC(+inicioCiclo.slice(0, 4), +inicioCiclo.slice(5, 7) - 1, +inicioCiclo.slice(8, 10));
  const n = Math.floor((a - b) / dia / 7) + 1;
  return n >= 1 && n <= semanas ? n : null;
}
