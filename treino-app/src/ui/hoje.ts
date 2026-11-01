import { CRONOGRAMA, FIM_DE_FASE, LEMBRETES_GERAIS, TREINOS } from '../data/plano';
import { alertasRegistro } from '../logic/alertas';
import { avaliarCarga, preOpEfetiva, tetoKg, ultimaCarga } from '../logic/cargas';
import { brCurto, hojeISO, semanaDoCalendario } from '../logic/datas';
import { proximoDoRodizio } from '../logic/rodizio';
import { estado, exercicios, novoId, salvarConfig, upsert } from '../store';
import type { Exercicio, GrupoTreino, RegistroTreino, SintomaPerna, TreinoLetra } from '../types';
import { caixaAlerta, fmtNum, h, lerNumero, toast } from './dom';

let selecionado: GrupoTreino | null = null;

export function infoCarga(ex: Exercicio): { teto: number | null; preOp: number | null; texto: string } {
  const { registros } = estado.dados;
  const sem = estado.config.semanaAtual;
  const ult = ultimaCarga(ex.id, registros);
  const ultTxt = ult?.cargaKg != null ? ` · última ${fmtNum(ult.cargaKg)} kg (${brCurto(ult.data)})` : '';
  if (ex.tipo === 'core') return { teto: null, preOp: null, texto: 'Dosagem conforme a fisioterapia' };
  if (ex.tipo === 'peso_corpo') return { teto: null, preOp: null, texto: 'Só o peso do corpo / isometria' };
  if (ex.tipo === 'do_zero') return { teto: null, preOp: null, texto: `Começa do zero, foco em técnica${ultTxt}` };
  const p = preOpEfetiva(ex, estado.config.ajustes[ex.id], registros);
  if (p.kg == null)
    return { teto: null, preOp: null, texto: `Sem pré-op: a carga da semana 1 conta como 50%${ultTxt}` };
  const teto = tetoKg(p.kg, sem, ex.incrementoKg);
  return {
    teto,
    preOp: p.kg,
    texto: `Pré-op ${fmtNum(p.kg)} kg${p.estimada ? ' (estimada)' : ''} · teto ${fmtNum(teto)} kg${ultTxt}`,
  };
}

function cartaoExercicio(ex: Exercicio, treino: GrupoTreino, registroHoje: RegistroTreino | undefined, recarregar: () => void): HTMLElement {
  const sem = estado.config.semanaAtual;
  const info = infoCarga(ex);
  const anterior = registroHoje ?? ultimaCarga(ex.id, estado.dados.registros);
  const plano = CRONOGRAMA[sem - 1];
  const temCarga = ex.tipo === 'apoiada' || ex.tipo === 'do_zero';

  const series = h('input', { type: 'text', inputMode: 'numeric', placeholder: plano?.series ?? '', value: fmtNum(registroHoje?.series) });
  const reps = h('input', { type: 'text', inputMode: 'text', placeholder: plano ? `${plano.reps}` : '12-12-10', value: registroHoje?.reps ?? '' });
  const carga = h('input', {
    type: 'text', inputMode: 'decimal',
    placeholder: info.teto != null ? `até ${fmtNum(info.teto)}` : 'kg',
    value: fmtNum(registroHoje?.cargaKg ?? (anterior?.cargaKg != null && (info.teto == null || anterior.cargaKg <= info.teto) ? anterior.cargaKg : info.teto)),
  });
  const rir = h('input', { type: 'text', inputMode: 'decimal', placeholder: plano?.rir ?? '', value: fmtNum(registroHoje?.rir) });
  const dor = h('input', { type: 'text', inputMode: 'numeric', placeholder: '0–10', value: fmtNum(registroHoje?.dor ?? 0) });
  const sintoma = h('select', null, ['Não', 'Igual ao residual', 'Novo'].map((o) => h('option', { value: o, selected: o === (registroHoje?.sintomaPerna ?? 'Não') }, o)));
  const obs = h('input', { type: 'text', placeholder: 'Observações', value: registroHoje?.obs ?? '' });
  const aviso = h('div', { class: 'aviso-carga' });

  const checar = () => {
    const st = avaliarCarga(lerNumero(carga.value), info.teto, info.preOp);
    aviso.textContent =
      st === 'acima-da-preop' ? 'Acima da carga pré-op: não ultrapassar neste ciclo.'
      : st === 'acima-do-teto' ? `Acima do teto da semana ${sem} (${fmtNum(info.teto)} kg).` : '';
    aviso.className = 'aviso-carga' + (st === 'ok' ? '' : ' ativo');
  };
  carga.addEventListener('input', checar);
  checar();

  const salvar = async () => {
    const reg: RegistroTreino = registroHoje ?? {
      id: novoId(), criadoEm: 0, atualizadoEm: 0, data: hojeISO(), semana: sem, treino, exercicioId: ex.id, exercicio: ex.nome,
      series: null, reps: '', cargaKg: null, rir: null, dor: null, sintomaPerna: 'Não', obs: '',
    };
    reg.series = lerNumero(series.value);
    reg.reps = reps.value.trim();
    reg.cargaKg = temCarga ? lerNumero(carga.value) : null;
    reg.rir = lerNumero(rir.value);
    reg.dor = lerNumero(dor.value);
    reg.sintomaPerna = sintoma.value as SintomaPerna;
    reg.obs = obs.value.trim();
    await upsert('registros', reg);
    const al = alertasRegistro(reg);
    if (al.length) window.alert(al.map((a) => a.texto).join('\n\n'));
    else toast('Exercício salvo');
    recarregar();
  };

  return h(
    'article',
    { class: 'cartao exercicio' + (registroHoje ? ' feito' : '') },
    h('div', { class: 'ex-topo' }, h('h3', null, ex.nome), registroHoje ? h('span', { class: 'selo ok' }, '✓ feito') : null),
    h('p', { class: 'ex-info' }, info.texto),
    ex.nota ? h('p', { class: 'ex-nota' }, ex.nota) : null,
    h(
      'div',
      { class: 'grade' },
      h('label', null, h('span', null, 'Séries'), series),
      h('label', { class: 'largo' }, h('span', null, 'Reps por série'), reps),
      temCarga ? h('label', null, h('span', null, 'Carga (kg)'), carga) : null,
      h('label', null, h('span', null, 'RIR'), rir),
      h('label', null, h('span', null, 'Dor (0–10)'), dor),
      h('label', { class: 'largo' }, h('span', null, 'Sintoma na perna'), sintoma),
      h('label', { class: 'inteiro' }, h('span', null, 'Observações'), obs),
    ),
    aviso,
    h('button', { class: 'btn primario', onclick: () => void salvar() }, registroHoje ? 'Atualizar' : 'Salvar exercício'),
  );
}

function timerDescanso(): HTMLElement {
  let fimEm = 0;
  let intervalo: number | undefined;
  const rotulo = h('span', null, 'Descanso');
  const parar = () => {
    clearInterval(intervalo);
    intervalo = undefined;
    rotulo.textContent = 'Descanso';
  };
  const iniciar = (seg: number) => {
    parar();
    fimEm = Date.now() + seg * 1000;
    const tick = () => {
      const r = Math.max(0, Math.round((fimEm - Date.now()) / 1000));
      rotulo.textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
      if (r === 0) {
        parar();
        navigator.vibrate?.(400);
        toast('Descanso concluído');
      }
    };
    tick();
    intervalo = window.setInterval(tick, 250);
  };
  return h(
    'div',
    { class: 'timer' },
    rotulo,
    h('button', { class: 'btn mini', onclick: () => iniciar(60) }, '60 s'),
    h('button', { class: 'btn mini', onclick: () => iniciar(90) }, '90 s'),
    h('button', { class: 'btn mini', onclick: parar, 'aria-label': 'Parar' }, '■'),
  );
}

export function telaHoje(recarregar: () => void): HTMLElement {
  const cfg = estado.config;
  const sem = cfg.semanaAtual;
  const plano = CRONOGRAMA[sem - 1]!;
  const hoje = hojeISO();
  const treino: GrupoTreino = selecionado ?? cfg.proximoTreino;
  const semCal = semanaDoCalendario(hoje, CRONOGRAMA[0]!.inicio);

  const todos = exercicios().filter((e) => e.treino === treino);
  const ativos = todos.filter((e) => !e.suspenso && e.liberadoSemana <= sem);
  const fora = todos.filter((e) => e.suspenso || e.liberadoSemana > sem);
  const deHoje = new Map(
    estado.dados.registros.filter((r) => r.data === hoje && r.treino === treino).map((r) => [r.exercicioId, r] as const),
  );
  const feitos = ativos.filter((e) => deHoje.has(e.id)).length;

  const concluir = async () => {
    if (treino === 'Core') return;
    if (!feitos && !window.confirm('Nenhum exercício salvo hoje. Concluir mesmo assim?')) return;
    const prox = proximoDoRodizio(treino as TreinoLetra);
    await salvarConfig({ proximoTreino: prox });
    selecionado = null;
    toast(`Treino ${treino} concluído. Próximo: ${prox}`);
    recarregar();
  };

  return h(
    'section',
    { class: 'tela' },
    h(
      'header',
      { class: 'topo' },
      h('span'),
      h('h1', null, 'Hoje'),
      h('span', { class: 'data' }, brCurto(hoje)),
    ),
    h(
      'div',
      { class: 'cartao resumo-semana' },
      h('div', { class: 'linha' }, h('strong', null, `Semana ${sem} · Fase ${plano.fase}`), h('span', { class: 'selo' }, `${plano.pct}% pré-op`)),
      h('p', null, `RIR alvo ${plano.rir} · ${plano.series} séries · ${plano.reps} reps`),
      h('p', null, `Aeróbico: ${plano.aerobico} (ritmo de conversa, sem meta de pace)`),
      plano.obs ? h('p', { class: 'mudo' }, plano.obs) : null,
      FIM_DE_FASE[sem] ? h('p', { class: 'destaque' }, 'Fim de fase: faça os testes de passagem no Check-in.') : null,
      semCal != null && semCal !== sem
        ? h('p', { class: 'mudo' }, `Pelo calendário seria a semana ${semCal}. A semana só avança após semana verde.`)
        : null,
    ),
    h(
      'div',
      { class: 'segmentos', role: 'tablist' },
      (['A', 'B', 'C', 'Core'] as GrupoTreino[]).map((t) =>
        h(
          'button',
          {
            role: 'tab',
            class: 'seg' + (t === treino ? ' ativo' : ''),
            'aria-selected': String(t === treino),
            onclick: () => {
              selecionado = t;
              recarregar();
            },
          },
          t === 'Core' ? 'Core' : `${t}${t === cfg.proximoTreino ? ' •' : ''}`,
        ),
      ),
    ),
    h('h2', null, `${treino === 'Core' ? '' : `Treino ${treino} — `}${TREINOS[treino].titulo}`),
    treino !== 'Core' && treino !== cfg.proximoTreino
      ? caixaAlerta('info', `Pelo rodízio, o próximo é o ${cfg.proximoTreino}.`)
      : null,
    h('ul', { class: 'lembretes' }, [...TREINOS[treino].lembretes, ...LEMBRETES_GERAIS].map((l) => h('li', null, l))),
    timerDescanso(),
    ativos.map((ex) => cartaoExercicio(ex, treino, deHoje.get(ex.id), recarregar)),
    fora.length
      ? h(
          'details',
          { class: 'cartao fora' },
          h('summary', null, `Fora desta semana (${fora.length})`),
          h('ul', null, fora.map((e) => h('li', null, `${e.nome} — ${e.suspenso ? 'suspenso (volta só com liberação)' : `a partir da semana ${e.liberadoSemana}, validar com cirurgião/fisio`}`))),
        )
      : null,
    treino !== 'Core'
      ? h(
          'button',
          { class: 'btn primario grande', onclick: () => void concluir() },
          `Concluir treino ${treino} (${feitos}/${ativos.length}) → próximo ${proximoDoRodizio(treino as TreinoLetra)}`,
        )
      : null,
  );
}
