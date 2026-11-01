import type { TreinoLetra } from '../types';

/** Rodízio contínuo A-B-C: depois do C vem o A, sem reiniciar na segunda. */
export function proximoDoRodizio(atual: TreinoLetra): TreinoLetra {
  return atual === 'A' ? 'B' : atual === 'B' ? 'C' : 'A';
}
