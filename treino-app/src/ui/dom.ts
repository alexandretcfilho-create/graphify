type Filho = Node | string | number | null | undefined | false;
type Attrs = Record<string, unknown>;

/** Cria elementos: h('button', { class: 'x', onclick: fn }, 'Texto'). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs | null, ...filhos: (Filho | Filho[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k in el && k !== 'list') (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const f of filhos.flat()) {
    if (f == null || f === false) continue;
    el.append(typeof f === 'string' || typeof f === 'number' ? document.createTextNode(String(f)) : f);
  }
  return el;
}

let timerToast: number | undefined;
export function toast(msg: string): void {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', role: 'status' });
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add('visivel');
  clearTimeout(timerToast);
  timerToast = window.setTimeout(() => el?.classList.remove('visivel'), 2600);
}

/** Lê número aceitando vírgula (teclado decimal do iPhone em pt-BR). */
export function lerNumero(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function fmtNum(n: number | null | undefined): string {
  return n == null ? '' : String(n).replace('.', ',');
}

export function cabecalho(titulo: string, voltar?: string, acao?: Node): HTMLElement {
  return h(
    'header',
    { class: 'topo' },
    voltar ? h('a', { class: 'voltar', href: voltar, 'aria-label': 'Voltar' }, '‹ Voltar') : h('span'),
    h('h1', null, titulo),
    acao ?? h('span'),
  );
}

export function caixaAlerta(nivel: 'emergencia' | 'cirurgiao' | 'atencao' | 'info', texto: string): HTMLElement {
  return h('div', { class: `alerta alerta-${nivel}`, role: nivel === 'info' ? 'note' : 'alert' }, texto);
}
