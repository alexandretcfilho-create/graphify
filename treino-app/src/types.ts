/** Modelos de dados. Espelham as abas da planilha "Retorno pós-cirúrgico — acompanhamento". */

export type TreinoLetra = 'A' | 'B' | 'C';
export type GrupoTreino = TreinoLetra | 'Core';

/**
 * apoiada  = máquina/polia, começa em 50% da pré-op e segue o teto semanal.
 * do_zero  = carga axial ou livre: começa do zero, foco em técnica.
 * core     = sem carga, dosagem conforme a fisioterapia.
 * peso_corpo = só o peso do corpo / isometria.
 */
export type TipoCarga = 'apoiada' | 'do_zero' | 'core' | 'peso_corpo';

export type SintomaPerna = 'Não' | 'Igual ao residual' | 'Novo';
export type CorSemana = '' | 'verde' | 'amarelo' | 'vermelho';

export interface Exercicio {
  id: string;
  treino: GrupoTreino;
  nome: string;
  tipo: TipoCarga;
  /** Semana do plano a partir da qual o exercício entra. */
  liberadoSemana: number;
  preOpKg: number | null;
  incrementoKg: number;
  suspenso?: boolean;
  nota?: string;
}

export interface SemanaPlano {
  semana: number;
  inicio: string; // ISO yyyy-mm-dd
  fim: string;
  fase: 1 | 2 | 3;
  pct: number; // % da carga pré-op (exercícios apoiados)
  rir: string;
  aerobico: string;
  obs: string;
  series: string;
  reps: string;
}

/** Campos comuns a todos os registros salvos. */
export interface Base {
  id: string;
  criadoEm: number;
  atualizadoEm: number;
}

export interface RegistroTreino extends Base {
  data: string;
  semana: number;
  treino: GrupoTreino;
  exercicioId: string;
  exercicio: string;
  series: number | null;
  reps: string;
  cargaKg: number | null;
  rir: number | null;
  dor: number | null;
  sintomaPerna: SintomaPerna;
  obs: string;
}

export interface Corrida extends Base {
  data: string;
  semana: number;
  tipo: string;
  distanciaKm: number | null;
  tempoMin: number | null;
  dor: number | null;
  sintomaPerna: SintomaPerna;
  depois24h: string;
  obs: string;
}

export interface CheckIn extends Base {
  data: string;
  semana: number;
  dorMax: number | null;
  quandoDoeu: string;
  sintomaPerna: SintomaPerna;
  ondeSintoma: string;
  rigidez: string;
  sonoH: number | null;
  pesoKg: number | null;
  abdomenCm: number | null;
  treinosA: number | null;
  treinosB: number | null;
  treinosC: number | null;
  sessoesFisio: number | null;
  diasCore: number | null;
  puladas: string;
  cargasPrincipais: string;
  corridas: number | null;
  kmSemana: number | null;
  depois24h: string;
  fisioNotas: string;
  proteinaG: number | null;
  refeicoesPuladas: string;
  esforcoTrabalho: string;
  cor: CorSemana;
  decisao: string;
  notas: string;
}

export interface Fisio extends Base {
  sessao: number | null;
  data: string;
  trabalhado: string;
  abdominal: string;
  orientacoes: string;
  liberacoes: string;
  sintomas: string;
  obs: string;
}

export interface Evolucao extends Base {
  data: string;
  dor: number | null;
  sintomaPerna: string;
  lado: string;
  tipoSintoma: string;
  intensidade: number | null;
  forca: string;
  rigidez: string;
  cefaleiaPostural: string;
  ferida: string;
  sela: string;
  obs: string;
}

export interface Composicao extends Base {
  data: string;
  aparelho: string;
  pesoKg: number | null;
  mme: number | null;
  massaMagra: number | null;
  mlg: number | null;
  massaGordura: number | null;
  pgc: number | null;
  imc: number | null;
  pontuacao: number | null;
  visceralNivel: number | null;
  visceralArea: number | null;
  tmb: number | null;
  agua: number | null;
  aec: number | null;
  bracoD: number | null;
  bracoE: number | null;
  tronco: number | null;
  pernaD: number | null;
  pernaE: number | null;
  idadeMetabolica: number | null;
  obs: string;
}

export interface Tabelas {
  registros: RegistroTreino;
  corridas: Corrida;
  checkins: CheckIn;
  fisio: Fisio;
  evolucao: Evolucao;
  composicao: Composicao;
}
export type StoreName = keyof Tabelas;
export const STORES: StoreName[] = ['registros', 'corridas', 'checkins', 'fisio', 'evolucao', 'composicao'];

export interface AjusteExercicio {
  preOpKg?: number | null;
  suspenso?: boolean;
}

export interface Configuracoes {
  semanaAtual: number;
  proximoTreino: TreinoLetra;
  /** Ajustes por exercício (pré-op informada no app, suspensão pela fisio). */
  ajustes: Record<string, AjusteExercicio>;
  /** Testes de passagem: chave = fase que termina (1, 2 ou 3). */
  testes: Record<string, { respostas: Record<string, boolean>; data?: string }>;
  /** Momento do último export; o CSV de "registros novos" parte daqui. */
  ultimoExport: number;
  historicoSemana: { data: string; de: number; para: number; motivo: string }[];
}

export interface Backup {
  app: 'treino';
  versao: 1;
  exportadoEm: string;
  configuracoes: Configuracoes;
  dados: { [K in StoreName]: Tabelas[K][] };
}
