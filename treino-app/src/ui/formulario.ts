import type { StoreName, Tabelas } from '../types';
import type { Campo, Tabela } from '../tabelas';
import { fmtNum, h, lerNumero } from './dom';

/** Formulário genérico a partir da especificação da tabela. */
export function formulario<K extends StoreName>(
  t: Tabela<K>,
  item: Tabelas[K],
  aoSalvar: (item: Tabelas[K]) => void | Promise<void>,
  aoApagar?: () => void | Promise<void>,
): HTMLFormElement {
  const valores = item as unknown as Record<string, unknown>;
  const entradas = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();

  const campo = (c: Campo<Tabelas[K]>) => {
    const v = valores[c.chave];
    let el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (c.tipo === 'select') {
      el = h('select', { name: c.chave }, (c.opcoes ?? []).map((o) => h('option', { value: o, selected: o === v }, o || '—')));
    } else if (c.tipo === 'textarea') {
      el = h('textarea', { name: c.chave, rows: 2 });
      el.value = String(v ?? '');
    } else if (c.tipo === 'number') {
      el = h('input', { name: c.chave, type: 'text', inputMode: 'decimal', autocomplete: 'off', placeholder: c.min != null && c.max != null ? `${c.min}–${c.max}` : '' });
      el.value = fmtNum(v as number | null);
    } else {
      el = h('input', { name: c.chave, type: c.tipo === 'date' ? 'date' : 'text', placeholder: c.dica ?? '' });
      el.value = String(v ?? '');
    }
    entradas.set(c.chave, el);
    return h('label', { class: 'campo' }, h('span', null, c.rotulo), el, c.dica && c.tipo !== 'text' ? h('small', null, c.dica) : null);
  };

  const form = h(
    'form',
    { class: 'form', novalidate: true },
    t.campos.map(campo),
    h(
      'div',
      { class: 'acoes' },
      aoApagar ? h('button', { type: 'button', class: 'btn perigo', onclick: () => void aoApagar() }, 'Apagar') : null,
      h('button', { type: 'submit', class: 'btn primario' }, 'Salvar'),
    ),
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    for (const c of t.campos) {
      const el = entradas.get(c.chave)!;
      if (c.tipo === 'number') {
        let n = lerNumero(el.value);
        if (n != null && c.min != null) n = Math.max(c.min, n);
        if (n != null && c.max != null) n = Math.min(c.max, n);
        valores[c.chave] = n;
      } else valores[c.chave] = el.value.trim();
    }
    if (typeof valores.semana !== 'number' && 'semana' in valores) valores.semana = 1;
    void aoSalvar(item);
  });
  return form;
}
