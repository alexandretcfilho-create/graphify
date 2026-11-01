import { isoParaBR, brCurto, hojeISO } from './logic/datas';
import { numBR, pace } from './logic/csv';
import { estado, novoId } from './store';
import type { StoreName, Tabelas } from './types';

export type TipoCampo = 'date' | 'number' | 'text' | 'textarea' | 'select';

export interface Campo<T> {
  chave: keyof T & string;
  rotulo: string;
  tipo: TipoCampo;
  /** Cabeçalho na planilha, quando difere do rótulo do formulário. */
  csv?: string;
  opcoes?: string[];
  passo?: number;
  min?: number;
  max?: number;
  dica?: string;
}

export interface Tabela<K extends StoreName> {
  store: K;
  titulo: string;
  /** Nome da aba na planilha (e do CSV exportado). */
  aba: string;
  campos: Campo<Tabelas[K]>[];
  novo: () => Tabelas[K];
  resumo: (r: Tabelas[K]) => string;
  /** Colunas extras calculadas: inseridas após a coluna `depoisDe`. */
  calculadas?: { depoisDe: keyof Tabelas[K] & string; cab: string; valor: (r: Tabelas[K]) => string }[];
}

const SINTOMA = ['Não', 'Igual ao residual', 'Novo'];
const SIM_NAO = ['Não', 'Sim'];
const base = () => ({ id: novoId(), criadoEm: 0, atualizadoEm: 0 });
const semana = () => estado.config.semanaAtual;

export const T_REGISTROS: Tabela<'registros'> = {
  store: 'registros',
  titulo: 'Registro de treinos',
  aba: 'Registro de treinos',
  campos: [
    { chave: 'data', rotulo: 'Data', tipo: 'date' },
    { chave: 'semana', rotulo: 'Semana do plano', tipo: 'number', min: 1, max: 12 },
    { chave: 'treino', rotulo: 'Treino', tipo: 'select', opcoes: ['A', 'B', 'C', 'Core'] },
    { chave: 'exercicio', rotulo: 'Exercício', tipo: 'text' },
    { chave: 'series', rotulo: 'Séries', tipo: 'number', min: 0 },
    { chave: 'reps', rotulo: 'Repetições por série', tipo: 'text', dica: 'ex.: 12-12-10' },
    { chave: 'cargaKg', rotulo: 'Carga (kg)', tipo: 'number', passo: 0.5, min: 0 },
    { chave: 'rir', rotulo: 'RIR médio', tipo: 'number', min: 0, max: 10, passo: 0.5 },
    { chave: 'dor', rotulo: 'Dor lombar (0-10)', tipo: 'number', min: 0, max: 10 },
    { chave: 'sintomaPerna', rotulo: 'Sintoma na perna', tipo: 'select', opcoes: SINTOMA },
    { chave: 'obs', rotulo: 'Observações', tipo: 'textarea' },
  ],
  novo: () => ({
    ...base(), data: hojeISO(), semana: semana(), treino: 'A', exercicioId: '', exercicio: '', series: null,
    reps: '', cargaKg: null, rir: null, dor: null, sintomaPerna: 'Não', obs: '',
  }),
  resumo: (r) =>
    `${brCurto(r.data)} · ${r.treino} · ${r.exercicio} · ${r.series ?? '-'}x ${r.reps || '-'}${r.cargaKg != null ? ` · ${numBR(r.cargaKg)} kg` : ''}`,
};

export const T_CORRIDAS: Tabela<'corridas'> = {
  store: 'corridas',
  titulo: 'Corrida e caminhada',
  aba: 'Corrida',
  campos: [
    { chave: 'data', rotulo: 'Data', tipo: 'date' },
    { chave: 'semana', rotulo: 'Semana do plano', tipo: 'number', min: 1, max: 12 },
    { chave: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: ['Caminhada', 'Caminhada inclinada', 'Caminhada com trote', 'Trote leve', 'Corrida leve'] },
    { chave: 'distanciaKm', rotulo: 'Distância (km)', tipo: 'number', passo: 0.01, min: 0 },
    { chave: 'tempoMin', rotulo: 'Tempo (min)', tipo: 'number', passo: 0.1, min: 0 },
    { chave: 'dor', rotulo: 'Dor lombar durante (0-10)', tipo: 'number', min: 0, max: 10 },
    { chave: 'sintomaPerna', rotulo: 'Sintoma na perna', tipo: 'select', opcoes: SINTOMA },
    { chave: 'depois24h', rotulo: 'Como ficou nas 24 h seguintes', tipo: 'select', opcoes: ['', 'Sem alteração', 'Dor leve', 'Piorou'] },
    { chave: 'obs', rotulo: 'Observações', tipo: 'textarea' },
  ],
  calculadas: [{ depoisDe: 'tempoMin', cab: 'Pace (min/km)', valor: (r) => pace(r.distanciaKm, r.tempoMin) }],
  novo: () => ({
    ...base(), data: hojeISO(), semana: semana(), tipo: 'Caminhada', distanciaKm: null, tempoMin: null, dor: 0,
    sintomaPerna: 'Não', depois24h: '', obs: '',
  }),
  resumo: (r) => {
    const p = pace(r.distanciaKm, r.tempoMin);
    return `${brCurto(r.data)} · ${r.tipo} · ${numBR(r.distanciaKm, 2) || '-'} km · ${numBR(r.tempoMin) || '-'} min${p ? ` · ${p}/km` : ''}`;
  },
};

export const T_CHECKINS: Tabela<'checkins'> = {
  store: 'checkins',
  titulo: 'Check-in semanal',
  aba: 'Check-in semanal',
  campos: [
    { chave: 'data', rotulo: 'Data do check-in', tipo: 'date' },
    { chave: 'semana', rotulo: 'Semana do plano', tipo: 'number', min: 1, max: 12 },
    { chave: 'dorMax', rotulo: 'Dor lombar máxima (0-10)', tipo: 'number', min: 0, max: 10 },
    { chave: 'quandoDoeu', rotulo: 'Quando doeu', tipo: 'text' },
    { chave: 'sintomaPerna', rotulo: 'Sintoma na perna', tipo: 'select', opcoes: SINTOMA },
    { chave: 'ondeSintoma', rotulo: 'Onde e qual sintoma', tipo: 'text' },
    { chave: 'rigidez', rotulo: 'Rigidez matinal', tipo: 'select', opcoes: ['Normal', 'Maior que o habitual'] },
    { chave: 'sonoH', rotulo: 'Sono médio (h)', tipo: 'number', passo: 0.5, min: 0, max: 14 },
    { chave: 'pesoKg', rotulo: 'Peso (kg)', tipo: 'number', passo: 0.1 },
    { chave: 'abdomenCm', rotulo: 'Circunferência abdominal (cm)', tipo: 'number', passo: 0.5 },
    { chave: 'treinosA', rotulo: 'Treinos A', tipo: 'number', min: 0 },
    { chave: 'treinosB', rotulo: 'Treinos B', tipo: 'number', min: 0 },
    { chave: 'treinosC', rotulo: 'Treinos C', tipo: 'number', min: 0 },
    { chave: 'sessoesFisio', rotulo: 'Sessões de fisio', tipo: 'number', min: 0 },
    { chave: 'diasCore', rotulo: 'Dias de core', tipo: 'number', min: 0, max: 7 },
    { chave: 'puladas', rotulo: 'Sessões puladas', tipo: 'text' },
    { chave: 'cargasPrincipais', rotulo: 'Cargas nos principais exercícios', tipo: 'textarea' },
    { chave: 'corridas', rotulo: 'Corridas registradas', tipo: 'number', min: 0 },
    { chave: 'kmSemana', rotulo: 'Km na semana', tipo: 'number', passo: 0.1, min: 0 },
    { chave: 'depois24h', rotulo: 'Como ficou nas 24 h após correr', tipo: 'text' },
    { chave: 'fisioNotas', rotulo: 'Fisio: o que foi trabalhado e orientações novas', tipo: 'textarea' },
    { chave: 'proteinaG', rotulo: 'Proteína diária aproximada (g)', tipo: 'number', min: 0 },
    { chave: 'refeicoesPuladas', rotulo: 'Refeições puladas', tipo: 'text' },
    { chave: 'esforcoTrabalho', rotulo: 'Esforço no trabalho (viatura, colete, operação)', tipo: 'textarea' },
    { chave: 'cor', rotulo: 'Cor da semana', tipo: 'select', opcoes: ['', 'verde', 'amarelo', 'vermelho'], dica: 'Preencha depois do feedback.' },
    { chave: 'decisao', rotulo: 'Decisão', tipo: 'select', opcoes: ['', 'Avançar', 'Repetir', 'Recuar'] },
    { chave: 'notas', rotulo: 'Notas do feedback', tipo: 'textarea' },
  ],
  novo: () => ({
    ...base(), data: hojeISO(), semana: semana(), dorMax: null, quandoDoeu: '', sintomaPerna: 'Não', ondeSintoma: '',
    rigidez: 'Normal', sonoH: null, pesoKg: null, abdomenCm: null, treinosA: null, treinosB: null, treinosC: null,
    sessoesFisio: null, diasCore: null, puladas: '', cargasPrincipais: '', corridas: null, kmSemana: null,
    depois24h: '', fisioNotas: '', proteinaG: null, refeicoesPuladas: '', esforcoTrabalho: '', cor: '', decisao: '', notas: '',
  }),
  resumo: (r) => `${brCurto(r.data)} · semana ${r.semana} · dor máx. ${r.dorMax ?? '-'}${r.cor ? ` · ${r.cor}` : ' · aguardando feedback'}`,
};

export const T_FISIO: Tabela<'fisio'> = {
  store: 'fisio',
  titulo: 'Fisioterapia',
  aba: 'Fisioterapia',
  campos: [
    { chave: 'sessao', rotulo: 'Sessão', tipo: 'number', min: 1 },
    { chave: 'data', rotulo: 'Data', tipo: 'date' },
    { chave: 'trabalhado', rotulo: 'O que foi trabalhado', tipo: 'textarea' },
    { chave: 'abdominal', rotulo: 'Abdominal prescrito (séries x repetições)', tipo: 'text' },
    { chave: 'orientacoes', rotulo: 'Orientações novas', tipo: 'textarea' },
    { chave: 'liberacoes', rotulo: 'Liberações ou restrições', tipo: 'textarea' },
    { chave: 'sintomas', rotulo: 'Sintomas durante ou depois', tipo: 'text' },
    { chave: 'obs', rotulo: 'Observações', tipo: 'textarea' },
  ],
  novo: () => ({
    ...base(), sessao: Math.max(0, ...estado.dados.fisio.map((f) => f.sessao ?? 0)) + 1, data: hojeISO(),
    trabalhado: '', abdominal: '', orientacoes: '', liberacoes: '', sintomas: '', obs: '',
  }),
  resumo: (r) => `Sessão ${r.sessao ?? '-'} · ${brCurto(r.data)}${r.trabalhado ? ` · ${r.trabalhado.slice(0, 40)}` : ''}`,
};

export const T_EVOLUCAO: Tabela<'evolucao'> = {
  store: 'evolucao',
  titulo: 'Evolução do quadro',
  aba: 'Evolução do quadro',
  campos: [
    { chave: 'data', rotulo: 'Data', tipo: 'date' },
    { chave: 'dor', rotulo: 'Dor lombar (0-10)', tipo: 'number', min: 0, max: 10 },
    { chave: 'sintomaPerna', rotulo: 'Sintoma na perna', tipo: 'select', opcoes: SINTOMA },
    { chave: 'lado', rotulo: 'Lado', tipo: 'select', opcoes: ['', 'Esquerda', 'Direita', 'Ambos'] },
    { chave: 'tipoSintoma', rotulo: 'Tipo de sintoma', tipo: 'select', opcoes: ['', 'Dor', 'Formigamento', 'Dormência', 'Fraqueza'] },
    { chave: 'intensidade', rotulo: 'Intensidade (0-10)', tipo: 'number', min: 0, max: 10 },
    { chave: 'forca', rotulo: 'Força nas pernas', tipo: 'select', opcoes: ['Normal', 'Igual ao residual', 'Piorando'] },
    { chave: 'rigidez', rotulo: 'Rigidez matinal', tipo: 'select', opcoes: ['Normal', 'Maior que o habitual'] },
    { chave: 'cefaleiaPostural', rotulo: 'Dor de cabeça que piora em pé', tipo: 'select', opcoes: SIM_NAO },
    { chave: 'ferida', rotulo: 'Ferida operatória', tipo: 'select', opcoes: ['Normal', 'Estufada', 'Saída de líquido', 'Vermelha ou quente'] },
    { chave: 'sela', rotulo: 'Urina, intestino ou dormência na sela', tipo: 'select', opcoes: SIM_NAO },
    { chave: 'obs', rotulo: 'Observações', tipo: 'textarea' },
  ],
  novo: () => ({
    ...base(), data: hojeISO(), dor: 0, sintomaPerna: 'Não', lado: '', tipoSintoma: '', intensidade: null,
    forca: 'Normal', rigidez: 'Normal', cefaleiaPostural: 'Não', ferida: 'Normal', sela: 'Não', obs: '',
  }),
  resumo: (r) => `${brCurto(r.data)} · dor ${r.dor ?? '-'} · perna: ${r.sintomaPerna}${r.lado ? ` (${r.lado})` : ''}`,
};

const n = (chave: keyof Tabelas['composicao'] & string, rotulo: string, passo = 0.1): Campo<Tabelas['composicao']> => ({
  chave, rotulo, tipo: 'number', passo,
});

export const T_COMPOSICAO: Tabela<'composicao'> = {
  store: 'composicao',
  titulo: 'Composição corporal',
  aba: 'Composição corporal',
  campos: [
    { chave: 'data', rotulo: 'Data', tipo: 'date' },
    { chave: 'aparelho', rotulo: 'Aparelho / local', tipo: 'text', dica: 'Compare sempre no mesmo aparelho e condições.' },
    n('pesoKg', 'Peso (kg)'), n('mme', 'Massa muscular esquelética (kg)'), n('massaMagra', 'Massa magra (kg)'),
    n('mlg', 'Massa livre de gordura (kg)'), n('massaGordura', 'Massa de gordura (kg)'), n('pgc', 'PGC (%)'),
    n('imc', 'IMC (kg/m²)'), n('pontuacao', 'Pontuação InBody', 1), n('visceralNivel', 'Nível de gordura visceral', 1),
    n('visceralArea', 'Área de gordura visceral (cm²)'), n('tmb', 'TMB (kcal)', 1), n('agua', 'Água corporal total (L)'),
    n('aec', 'Taxa de AEC', 0.001), n('bracoD', 'Braço direito (kg)', 0.01), n('bracoE', 'Braço esquerdo (kg)', 0.01),
    n('tronco', 'Tronco (kg)', 0.01), n('pernaD', 'Perna direita (kg)', 0.01), n('pernaE', 'Perna esquerda (kg)', 0.01),
    n('idadeMetabolica', 'Idade metabólica', 1),
    { chave: 'obs', rotulo: 'Observações', tipo: 'textarea' },
  ],
  novo: () => ({
    ...base(), data: hojeISO(), aparelho: '', pesoKg: null, mme: null, massaMagra: null, mlg: null, massaGordura: null,
    pgc: null, imc: null, pontuacao: null, visceralNivel: null, visceralArea: null, tmb: null, agua: null, aec: null,
    bracoD: null, bracoE: null, tronco: null, pernaD: null, pernaE: null, idadeMetabolica: null, obs: '',
  }),
  resumo: (r) =>
    `${brCurto(r.data)} · ${numBR(r.pesoKg) || '-'} kg · MME ${numBR(r.mme) || '-'} · PGC ${numBR(r.pgc) || '-'}%`,
};

export const TABELAS = {
  registros: T_REGISTROS,
  corridas: T_CORRIDAS,
  checkins: T_CHECKINS,
  fisio: T_FISIO,
  evolucao: T_EVOLUCAO,
  composicao: T_COMPOSICAO,
} as { [K in StoreName]: Tabela<K> };

/** Cabeçalho + linhas no formato da aba da planilha. */
export function linhasCSV<K extends StoreName>(t: Tabela<K>, itens: Tabelas[K][]): { cab: string[]; linhas: string[][] } {
  const cab: string[] = [];
  const getters: ((r: Tabelas[K]) => string)[] = [];
  for (const c of t.campos) {
    cab.push(c.csv ?? c.rotulo);
    getters.push((r) => {
      const v = (r as unknown as Record<string, unknown>)[c.chave];
      if (v == null) return '';
      if (c.tipo === 'date') return isoParaBR(String(v));
      if (typeof v === 'number') return numBR(v);
      return String(v);
    });
    for (const extra of t.calculadas ?? []) {
      if (extra.depoisDe === c.chave) {
        cab.push(extra.cab);
        getters.push(extra.valor);
      }
    }
  }
  const ordenados = [...itens].sort((a, b) => {
    const da = String((a as unknown as Record<string, unknown>).data ?? '');
    const dbb = String((b as unknown as Record<string, unknown>).data ?? '');
    return da.localeCompare(dbb) || a.criadoEm - b.criadoEm;
  });
  return { cab, linhas: ordenados.map((r) => getters.map((g) => g(r))) };
}
