import type { Corrida, Evolucao, RegistroTreino } from '../types';

export type NivelAlerta = 'emergencia' | 'cirurgiao' | 'atencao';
export interface Alerta {
  nivel: NivelAlerta;
  texto: string;
}

export const TEXTO_EMERGENCIA =
  'Alteração urinária/intestinal, dormência em sela ou fraqueza progressiva nas pernas: procure o pronto-socorro imediatamente.';
export const TEXTO_CIRURGIAO =
  'Dor de cabeça que piora em pé e melhora deitado, ferida estufada ou saída de líquido claro pela incisão: contato imediato com o cirurgião.';

export function alertasEvolucao(e: Pick<Evolucao, 'sela' | 'forca' | 'cefaleiaPostural' | 'ferida' | 'sintomaPerna'>): Alerta[] {
  const out: Alerta[] = [];
  if (e.sela === 'Sim' || e.forca === 'Piorando') out.push({ nivel: 'emergencia', texto: TEXTO_EMERGENCIA });
  if (e.cefaleiaPostural === 'Sim' || (e.ferida && e.ferida !== 'Normal'))
    out.push({ nivel: 'cirurgiao', texto: TEXTO_CIRURGIAO });
  if (e.sintomaPerna === 'Novo')
    out.push({ nivel: 'atencao', texto: 'Sintoma novo na perna: registre no check-in e avise a equipe antes de progredir.' });
  return out;
}

export function alertasRegistro(r: Pick<RegistroTreino, 'sintomaPerna' | 'dor' | 'treino'>): Alerta[] {
  const out: Alerta[] = [];
  if (r.sintomaPerna === 'Novo')
    out.push({
      nivel: 'atencao',
      texto:
        r.treino === 'Core'
          ? 'Sintoma na perna no core: suspender o exercício e avisar a fisioterapia.'
          : 'Sintoma novo na perna: pare o exercício, registre e avise a equipe.',
    });
  if (r.dor != null && r.dor >= 4)
    out.push({ nivel: 'atencao', texto: 'Dor lombar alta durante o treino: interrompa e registre no check-in.' });
  return out;
}

export function alertasCorrida(c: Pick<Corrida, 'dor' | 'sintomaPerna'>): Alerta[] {
  const out: Alerta[] = [];
  if ((c.dor != null && c.dor > 0) || c.sintomaPerna === 'Novo')
    out.push({
      nivel: 'atencao',
      texto: 'Dor durante a corrida ou nas 24 h seguintes: volte ao passo anterior da progressão.',
    });
  return out;
}
