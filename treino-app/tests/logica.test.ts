import { describe, expect, it } from 'vitest';
import { CRONOGRAMA, EXERCICIOS } from '../src/data/plano';
import { alertasCorrida, alertasEvolucao } from '../src/logic/alertas';
import { avaliarCarga, preOpEfetiva, tetoKg } from '../src/logic/cargas';
import { janelaDoCheckin, resumoParaCheckin } from '../src/logic/checkin';
import { gerarCSV, numBR, pace } from '../src/logic/csv';
import { isoParaBR, semanaDoCalendario } from '../src/logic/datas';
import { proximoDoRodizio } from '../src/logic/rodizio';
import type { Corrida, RegistroTreino } from '../src/types';

const reg = (p: Partial<RegistroTreino>): RegistroTreino => ({
  id: Math.random().toString(), criadoEm: 1, atualizadoEm: 1, data: '2026-10-13', semana: 1, treino: 'A',
  exercicioId: 'x', exercicio: 'X', series: 3, reps: '12-12-12', cargaKg: null, rir: 4, dor: 0, sintomaPerna: 'Não', obs: '', ...p,
});

describe('teto de carga (aba Cargas)', () => {
  it('bate com os valores calculados pela planilha na semana 1', () => {
    expect(tetoKg(80, 1)).toBe(40);
    expect(tetoKg(30, 1)).toBe(15);
    expect(tetoKg(28, 1)).toBe(12.5);
    expect(tetoKg(36, 1)).toBe(17.5);
    expect(tetoKg(18, 1)).toBe(7.5);
    expect(tetoKg(90, 1)).toBe(45);
    expect(tetoKg(46, 1)).toBe(22.5);
    expect(tetoKg(74, 1)).toBe(35);
  });
  it('sobe até 90% na semana 12, arredondando para baixo', () => {
    expect(tetoKg(100, 12)).toBe(90);
    expect(tetoKg(80, 4)).toBe(50); // 65% = 52 -> 50
    expect(tetoKg(80, 9)).toBe(62.5); // 80% = 64
  });
  it('pré-op desconhecida: carga da semana 1 vale 50% (pré-op = dobro)', () => {
    const ex = EXERCICIOS.find((e) => e.preOpKg == null && e.tipo === 'apoiada')!;
    const p = preOpEfetiva(ex, undefined, [reg({ exercicioId: ex.id, cargaKg: 20 })]);
    expect(p).toEqual({ kg: 40, estimada: true });
    expect(preOpEfetiva(ex, { preOpKg: 50 }, []).kg).toBe(50);
  });
  it('sinaliza carga acima do teto e da pré-op', () => {
    expect(avaliarCarga(42, 40, 80)).toBe('acima-do-teto');
    expect(avaliarCarga(81, 40, 80)).toBe('acima-da-preop');
    expect(avaliarCarga(40, 40, 80)).toBe('ok');
  });
});

describe('plano', () => {
  it('tem 12 semanas contíguas', () => {
    expect(CRONOGRAMA).toHaveLength(12);
    expect(CRONOGRAMA[0]!.inicio).toBe('2026-10-12');
    expect(CRONOGRAMA[11]!.fim).toBe('2027-01-03');
  });
  it('leg press suspenso e ids únicos', () => {
    expect(EXERCICIOS.find((e) => e.nome.startsWith('Leg press'))!.suspenso).toBe(true);
    expect(new Set(EXERCICIOS.map((e) => e.id)).size).toBe(EXERCICIOS.length);
  });
  it('rodízio contínuo A-B-C', () => {
    expect(proximoDoRodizio('A')).toBe('B');
    expect(proximoDoRodizio('C')).toBe('A');
  });
  it('semana do calendário', () => {
    expect(semanaDoCalendario('2026-10-12', '2026-10-12')).toBe(1);
    expect(semanaDoCalendario('2026-11-01', '2026-10-12')).toBe(3);
    expect(semanaDoCalendario('2027-02-01', '2026-10-12')).toBeNull();
  });
});

describe('CSV', () => {
  it('formato pt-BR', () => {
    expect(numBR(7.6)).toBe('7,6');
    expect(isoParaBR('2026-10-13')).toBe('13/10/2026');
    expect(pace(3, 35)).toBe('11:40');
    const csv = gerarCSV(['A', 'B'], [['1;2', 'x"y']]);
    expect(csv).toBe('﻿A;B\r\n"1;2";"x""y"\r\n');
  });
});

describe('alertas', () => {
  it('sinais de emergência', () => {
    const base = { sela: 'Não', forca: 'Normal', cefaleiaPostural: 'Não', ferida: 'Normal', sintomaPerna: 'Não' };
    expect(alertasEvolucao(base)).toEqual([]);
    expect(alertasEvolucao({ ...base, sela: 'Sim' })[0]!.nivel).toBe('emergencia');
    expect(alertasEvolucao({ ...base, cefaleiaPostural: 'Sim' })[0]!.nivel).toBe('cirurgiao');
    expect(alertasCorrida({ dor: 2, sintomaPerna: 'Não' })).toHaveLength(1);
    expect(alertasCorrida({ dor: 0, sintomaPerna: 'Não' })).toHaveLength(0);
  });
});

describe('check-in', () => {
  it('conta sessões e km desde o check-in anterior', () => {
    const j = janelaDoCheckin('2026-10-25', 2, [
      { id: 'c1', data: '2026-10-18' } as never,
    ]);
    expect(j).toEqual({ desde: '2026-10-18', ate: '2026-10-25' });
    const regs = [
      reg({ data: '2026-10-18', treino: 'A' }), // fora (dia do check-in anterior)
      reg({ data: '2026-10-19', treino: 'A', cargaKg: 40, exercicio: 'Puxada' }),
      reg({ data: '2026-10-19', treino: 'A', exercicioId: 'y' }),
      reg({ data: '2026-10-20', treino: 'B' }),
      reg({ data: '2026-10-20', treino: 'Core' }),
      reg({ data: '2026-10-21', treino: 'Core' }),
    ];
    const corridas = [{ data: '2026-10-19', distanciaKm: 3 }, { data: '2026-10-22', distanciaKm: 2.5 }] as Corrida[];
    const r = resumoParaCheckin(j, regs, corridas, []);
    expect(r).toMatchObject({ treinosA: 1, treinosB: 1, treinosC: 0, diasCore: 2, corridas: 2, kmSemana: 5.5 });
    expect(r.cargasPrincipais).toBe('Puxada: 40 kg');
  });
});
