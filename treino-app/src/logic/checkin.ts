import { CRONOGRAMA } from '../data/plano';
import type { CheckIn, Corrida, Fisio, RegistroTreino } from '../types';
import { numBR, pace } from './csv';
import { isoParaBR } from './datas';

export interface Janela {
  /** Exclusivo. */
  desde: string;
  /** Inclusivo. */
  ate: string;
}

/** Período do check-in: do check-in anterior (exclusivo) até a data do novo. */
export function janelaDoCheckin(data: string, semana: number, checkins: CheckIn[], idAtual?: string): Janela {
  const anterior = checkins
    .filter((c) => c.id !== idAtual && c.data < data)
    .map((c) => c.data)
    .sort()
    .pop();
  if (anterior) return { desde: anterior, ate: data };
  const inicio = CRONOGRAMA[Math.max(1, Math.min(12, semana)) - 1]?.inicio ?? data;
  const d = new Date(inicio + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return { desde: d.toISOString().slice(0, 10), ate: data };
}

const dentro = (d: string, j: Janela) => d > j.desde && d <= j.ate;

/** Pré-preenche o check-in com o que já está registrado no app. */
export function resumoParaCheckin(
  j: Janela,
  registros: RegistroTreino[],
  corridas: Corrida[],
  fisio: Fisio[],
): Pick<CheckIn, 'treinosA' | 'treinosB' | 'treinosC' | 'diasCore' | 'corridas' | 'kmSemana' | 'sessoesFisio' | 'cargasPrincipais'> {
  const regs = registros.filter((r) => dentro(r.data, j));
  const sessoes = (l: string) => new Set(regs.filter((r) => r.treino === l).map((r) => r.data)).size;
  const runs = corridas.filter((c) => dentro(c.data, j));
  const ultimas = new Map<string, RegistroTreino>();
  for (const r of [...regs].sort((a, b) => a.data.localeCompare(b.data) || a.criadoEm - b.criadoEm)) {
    if (r.treino !== 'Core' && r.cargaKg != null && r.cargaKg > 0) ultimas.set(r.exercicioId || r.exercicio, r);
  }
  return {
    treinosA: sessoes('A'),
    treinosB: sessoes('B'),
    treinosC: sessoes('C'),
    diasCore: sessoes('Core'),
    corridas: runs.length,
    kmSemana: Math.round(runs.reduce((s, c) => s + (c.distanciaKm ?? 0), 0) * 100) / 100,
    sessoesFisio: fisio.filter((f) => dentro(f.data, j)).length,
    cargasPrincipais: [...ultimas.values()].map((r) => `${r.exercicio}: ${numBR(r.cargaKg)} kg`).join('; '),
  };
}

/** Texto no "Modelo de check-in semanal" do projeto, pronto para colar no chat. */
export function textoCheckin(c: CheckIn, corridas: Corrida[], j: Janela): string {
  const runs = corridas
    .filter((r) => dentro(r.data, j))
    .map((r) => `${isoParaBR(r.data)} ${r.tipo} ${numBR(r.distanciaKm, 2)} km em ${numBR(r.tempoMin)} min${pace(r.distanciaKm, r.tempoMin) ? ` (${pace(r.distanciaKm, r.tempoMin)}/km)` : ''}${r.depois24h ? `, 24 h: ${r.depois24h}` : ''}`);
  const v = (x: unknown) => (x == null || x === '' ? '-' : typeof x === 'number' ? numBR(x) : String(x));
  return [
    `Check-in semanal — semana ${c.semana} (${isoParaBR(j.desde)} a ${isoParaBR(c.data)})`,
    `- Dor lombar máxima (0–10) e quando: ${v(c.dorMax)}${c.quandoDoeu ? ` — ${c.quandoDoeu}` : ''}`,
    `- Sintoma na perna: ${c.sintomaPerna}${c.ondeSintoma ? ` — ${c.ondeSintoma}` : ''}`,
    `- Rigidez matinal: ${v(c.rigidez)}`,
    `- Sono médio (h): ${v(c.sonoH)}`,
    `- Peso (kg) / circunferência abdominal (cm): ${v(c.pesoKg)} / ${v(c.abdomenCm)}`,
    `- Sessões: A ${v(c.treinosA)} · B ${v(c.treinosB)} · C ${v(c.treinosC)} · core ${v(c.diasCore)} dias · fisio ${v(c.sessoesFisio)} · puladas: ${v(c.puladas)}`,
    `- Cargas nos principais exercícios: ${v(c.cargasPrincipais)}`,
    `- Corrida: ${v(c.corridas)} sessões, ${v(c.kmSemana)} km${runs.length ? `\n  ${runs.join('\n  ')}` : ''}`,
    `- Como ficou nas 24 h após correr: ${v(c.depois24h)}`,
    `- Fisioterapia: ${v(c.fisioNotas)}`,
    `- Alimentação: proteína ~${v(c.proteinaG)} g/dia; refeições puladas: ${v(c.refeicoesPuladas)}`,
    `- Esforço no trabalho: ${v(c.esforcoTrabalho)}`,
  ].join('\n');
}
