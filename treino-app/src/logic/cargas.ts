import { CRONOGRAMA } from '../data/plano';
import type { AjusteExercicio, Exercicio, RegistroTreino } from '../types';

export function pctDaSemana(semana: number): number {
  const s = CRONOGRAMA[Math.min(Math.max(semana, 1), CRONOGRAMA.length) - 1];
  return s ? s.pct : 50;
}

/**
 * Teto de carga da semana: % da pré-op arredondado PARA BAIXO no incremento
 * da máquina (2,5 kg). Ex.: 36 kg pré-op, semana 1 (50%) -> 18 -> 17,5 kg.
 */
export function tetoKg(preOpKg: number, semana: number, incrementoKg = 2.5): number {
  const bruto = (preOpKg * pctDaSemana(semana)) / 100;
  if (!incrementoKg) return Math.floor(bruto * 10) / 10;
  return Math.round(Math.floor(bruto / incrementoKg + 1e-9) * incrementoKg * 100) / 100;
}

export interface PreOp {
  kg: number | null;
  /** true quando veio da regra "carga da semana 1 = 50%" (pré-op = o dobro). */
  estimada: boolean;
}

/**
 * Carga pré-op efetiva: a informada no app > a da ficha > estimada pela
 * primeira carga registrada na semana 1 (vale como 50%, então pré-op = dobro).
 */
export function preOpEfetiva(ex: Exercicio, ajuste: AjusteExercicio | undefined, registros: RegistroTreino[]): PreOp {
  if (ajuste && ajuste.preOpKg != null) return { kg: ajuste.preOpKg, estimada: false };
  if (ex.preOpKg != null) return { kg: ex.preOpKg, estimada: false };
  const sem1 = registros
    .filter((r) => r.exercicioId === ex.id && r.semana === 1 && r.cargaKg != null && r.cargaKg > 0)
    .sort((a, b) => a.data.localeCompare(b.data) || a.criadoEm - b.criadoEm)[0];
  return sem1 && sem1.cargaKg != null ? { kg: sem1.cargaKg * 2, estimada: true } : { kg: null, estimada: false };
}

export function ultimaCarga(exId: string, registros: RegistroTreino[]): RegistroTreino | undefined {
  return registros
    .filter((r) => r.exercicioId === exId)
    .sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm - a.criadoEm)[0];
}

export type StatusCarga = 'ok' | 'acima-do-teto' | 'acima-da-preop';

export function avaliarCarga(cargaKg: number | null, teto: number | null, preOp: number | null): StatusCarga {
  if (cargaKg == null) return 'ok';
  if (preOp != null && cargaKg > preOp) return 'acima-da-preop';
  if (teto != null && cargaKg > teto) return 'acima-do-teto';
  return 'ok';
}
