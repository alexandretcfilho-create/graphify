import type { Exercicio, GrupoTreino, SemanaPlano, TipoCarga } from '../types';

/**
 * Plano vigente: ciclo de 12 semanas (12/10/2026 a 03/01/2027), rodízio A-B-C
 * com no mínimo 5 treinos por semana e core diário.
 * Fonte: abas "Cronograma", "Cargas", "Exercícios adiados" e "Testes de
 * passagem" da planilha de acompanhamento. Se a ficha mudar, edite aqui.
 */

export const CICLO = { inicio: '2026-10-12', fim: '2027-01-03', semanas: 12 };

export const TREINOS: Record<GrupoTreino, { titulo: string; lembretes: string[] }> = {
  A: {
    titulo: 'Costas e bíceps',
    lembretes: ['Cadeia posterior leve só a partir da semana 5 (Fase 2).'],
  },
  B: {
    titulo: 'Peito, tríceps e panturrilha',
    lembretes: [],
  },
  C: {
    titulo: 'Pernas, ombro e trapézio',
    lembretes: [
      'Aeróbico antes do C: só caminhada inclinada leve (trote/corrida antes do A ou B).',
      'Pernas sem carga axial. Leg press suspenso pela fisioterapia: agachamento com o peso do corpo e isometria.',
      'Ombro só em máquina sentado com encosto. Encolhimento apoiado no banco inclinado, nada pesado em pé.',
    ],
  },
  Core: {
    titulo: 'Core diário',
    lembretes: [
      'Dosagem da fisioterapia. Não aumentar repetições nem pôr carga sem aval dela.',
      'Sintoma na perna durante ou depois = suspender e avisar.',
    ],
  },
};

export const LEMBRETES_GERAIS = [
  'Respiração contínua: não prender o ar sob carga.',
  'Sentir-se forte não é critério de progressão.',
  'Descanso de 60–90 s entre séries.',
];

const pct = [50, 55, 60, 65, 65, 70, 75, 75, 80, 85, 90, 90];

export const CRONOGRAMA: SemanaPlano[] = [
  ['2026-10-12', '2026-10-18', 1, '4', 'Caminhada', 'Carga inicial de 50%. Semana amarela: cortar 1 dia de treino antes de reduzir carga.', '2-3', '10-15'],
  ['2026-10-19', '2026-10-25', 1, '3-4', 'Caminhada', '', '2-3', '10-15'],
  ['2026-10-26', '2026-11-01', 1, '3', 'Caminhada com trechos de trote leve', '', '2-3', '10-15'],
  ['2026-11-02', '2026-11-08', 1, '2-3', 'Caminhada com trechos de trote leve', 'Fim de fase: testes de passagem.', '2-3', '10-15'],
  ['2026-11-09', '2026-11-15', 2, '2', 'Trote leve alternado com caminhada', 'Entra cadeia posterior leve no dia A.', '3', '8-12'],
  ['2026-11-16', '2026-11-22', 2, '2', 'Trote leve alternado com caminhada', '', '3', '8-12'],
  ['2026-11-23', '2026-11-29', 2, '2', 'Trote leve alternado com caminhada', '', '3', '8-12'],
  ['2026-11-30', '2026-12-06', 2, '2', 'Até 25 min de trote leve contínuo', 'Semana de consolidação. Fim de fase: testes de passagem.', '3', '8-12'],
  ['2026-12-07', '2026-12-13', 3, '1-2', '3,5 km contínuos leves', 'Goblet e farmer carry liberados.', '3-4', '6-10 nas máquinas'],
  ['2026-12-14', '2026-12-20', 3, '1-2', 'Progressão até 5 km leves', 'Landmine liberado.', '3-4', '6-10 nas máquinas'],
  ['2026-12-21', '2026-12-27', 3, '1-2', 'Progressão até 5 km leves', '', '3-4', '6-10 nas máquinas'],
  ['2026-12-28', '2027-01-03', 3, '1-2', '5 km contínuos leves', 'Fim do ciclo: testes de passagem.', '3-4', '6-10 nas máquinas'],
].map(([inicio, fim, fase, rir, aerobico, obs, series, reps], i) => ({
  semana: i + 1,
  inicio: inicio as string,
  fim: fim as string,
  fase: fase as 1 | 2 | 3,
  pct: pct[i]!,
  rir: rir as string,
  aerobico: aerobico as string,
  obs: obs as string,
  series: series as string,
  reps: reps as string,
}));

/** Semanas em que a fase termina e os testes de passagem são exigidos. */
export const FIM_DE_FASE: Record<number, 1 | 2 | 3> = { 4: 1, 8: 2, 12: 3 };

type Linha = [GrupoTreino, string, TipoCarga, number, number | null, string?];

const LINHAS: Linha[] = [
  ['A', 'Puxada frontal na polia alta', 'apoiada', 1, 80],
  ['A', 'Puxada neutra com triângulo', 'apoiada', 1, 60],
  ['A', 'Remada sentada na máquina com apoio no peito', 'apoiada', 1, 50],
  ['A', 'Remada baixa na polia (tronco neutro, sem balanço)', 'apoiada', 1, null],
  ['A', 'Pulldown com braços estendidos na polia', 'apoiada', 1, 30],
  ['A', 'Rosca Scott na máquina', 'apoiada', 1, null],
  ['A', 'Rosca na polia baixa', 'apoiada', 1, 25],
  ['A', 'Cadeia posterior leve (conforme a ficha)', 'do_zero', 5, null],
  ['B', 'Supino reto na máquina', 'apoiada', 1, null],
  ['B', 'Supino inclinado na máquina', 'apoiada', 1, null],
  ['B', 'Voador (peck deck)', 'apoiada', 1, null],
  ['B', 'Crossover na polia', 'apoiada', 1, 28],
  ['B', 'Tríceps na polia (barra ou corda)', 'apoiada', 1, 36],
  ['B', 'Tríceps unilateral na polia', 'apoiada', 1, 18],
  ['B', 'Crucifixo com polia', 'apoiada', 1, 18],
  ['B', 'Peito na polia baixa', 'apoiada', 1, 18],
  ['B', 'Panturrilha sentado na máquina', 'apoiada', 1, null],
  ['C', 'Leg press (sem tirar o quadril do encosto no fundo)', 'apoiada', 1, 90, 'Suspenso pela fisioterapia: volta só com liberação dela.'],
  ['C', 'Agachamento só com o peso do corpo', 'peso_corpo', 1, null, 'Substitui o leg press (orientação da fisioterapia).'],
  ['C', 'Isometria de pernas (conforme a fisioterapia)', 'peso_corpo', 1, null, 'Substitui o leg press (orientação da fisioterapia).'],
  ['C', 'Cadeira extensora', 'apoiada', 1, 46],
  ['C', 'Panturrilha no leg press 90°', 'apoiada', 1, 74],
  ['C', 'Cadeira flexora', 'apoiada', 1, null],
  ['C', 'Cadeira abdutora', 'apoiada', 1, 36],
  ['C', 'Cadeira adutora', 'apoiada', 1, 36],
  ['C', 'Afundo ou split squat unilateral', 'do_zero', 1, null],
  ['C', 'Agachamento goblet', 'do_zero', 9, null],
  ['C', 'Desenvolvimento na máquina sentado com encosto', 'apoiada', 1, null],
  ['C', 'Elevação lateral na máquina sentado', 'apoiada', 1, null],
  ['C', 'Crucifixo inverso na máquina', 'apoiada', 1, null],
  ['C', 'Landmine press', 'do_zero', 10, null],
  ['C', 'Encolhimento com halteres apoiado no banco inclinado', 'do_zero', 1, null],
  ['C', 'Farmer carry', 'do_zero', 9, null],
  ['Core', 'Abdominal prescrito pelo médico (pernas a 90°, amplitude parcial)', 'core', 1, null, 'Braços cruzados no peito, sem buscar encostar cotovelos nos joelhos. Foco em ativação.'],
  ['Core', 'Curl-up de McGill', 'core', 1, null],
  ['Core', 'Prancha lateral', 'core', 1, null],
  ['Core', 'Bird dog', 'core', 1, null],
  ['Core', 'Prancha frontal (antebraços no chão, cotovelos a 90°)', 'core', 1, null],
  ['Core', 'Ponte (elevação controlada do quadril)', 'core', 1, null],
];

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const EXERCICIOS: Exercicio[] = LINHAS.map(([treino, nome, tipo, liberadoSemana, preOpKg, nota]) => ({
  id: `${treino.toLowerCase()}-${slug(nome)}`.slice(0, 60),
  treino,
  nome,
  tipo,
  liberadoSemana,
  preOpKg,
  incrementoKg: tipo === 'apoiada' ? 2.5 : 0,
  suspenso: nome.startsWith('Leg press') ? true : undefined,
  nota,
}));

export const ADIADOS: { item: string; liberacao: string; condicao: string }[] = [
  { item: 'Cadeia posterior leve (dia A)', liberacao: 'Semana 5 (Fase 2)', condicao: 'Fase 1 aprovada nos testes de passagem' },
  { item: 'Trote leve alternado com caminhada', liberacao: 'Semana 5 (Fase 2)', condicao: 'Caminhada com trote sem dor nas 24 h seguintes' },
  { item: 'Até 25 min de trote leve contínuo', liberacao: 'Semana 8', condicao: 'Trote alternado sem dor' },
  { item: 'Agachamento goblet', liberacao: 'Semana 9 (Fase 3)', condicao: 'Fase 2 aprovada. Começa do zero' },
  { item: 'Farmer carry', liberacao: 'Semana 9 (Fase 3)', condicao: 'Fase 2 aprovada. Começa leve' },
  { item: 'Landmine press', liberacao: 'Semana 10', condicao: 'Começa do zero' },
  { item: 'Corrida leve contínua de 3,5 a 5 km', liberacao: 'Fase 3', condicao: '25 min contínuos sem dor' },
  { item: 'Flexão lombar com carga', liberacao: 'Vetado nas Fases 1 e 2', condicao: 'Reavaliar com a equipe na Fase 3' },
  { item: 'Torção de tronco com carga', liberacao: 'Vetado nas Fases 1 e 2', condicao: 'Reavaliar com a equipe na Fase 3' },
  { item: 'Impacto (saltos, pliometria)', liberacao: 'Vetado nas Fases 1 e 2', condicao: 'Reavaliar com a equipe na Fase 3' },
  { item: 'Encolhimento pesado em pé', liberacao: 'Fora deste ciclo', condicao: 'Usar a versão apoiada no banco inclinado' },
  { item: 'Kickboxing', liberacao: 'Vetado', condicao: 'Somente com nova liberação médica' },
];

export const TESTES_PASSAGEM = [
  'Última semana da fase foi verde',
  'Nenhum sintoma novo na perna durante a fase',
  'Cargas-alvo da fase feitas com o RIR previsto e boa técnica',
  'Meta aeróbica da fase cumprida sem dor e sem piora nas 24 h seguintes',
  'Sem dor de cabeça postural nem alteração na ferida',
  'Mudança de fase validada com cirurgião ou fisioterapeuta',
];
