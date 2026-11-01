import './styles.css';
import { CRONOGRAMA } from './data/plano';
import { TEXTO_CIRURGIAO, TEXTO_EMERGENCIA } from './logic/alertas';
import { carregar, estado } from './store';
import { STORES, type StoreName } from './types';
import { caixaAlerta, h } from './ui/dom';
import { telaCheckin } from './ui/checkin';
import { telaHoje } from './ui/hoje';
import { editar, lista } from './ui/listas';
import { telaAjustes, telaBackup, telaCargas, telaMais, telaPlano } from './ui/mais';

const app = document.getElementById('app')!;

const ABAS: { rota: string; rotulo: string; icone: string }[] = [
  { rota: '#/hoje', rotulo: 'Hoje', icone: '🏋️' },
  { rota: '#/corrida', rotulo: 'Corrida', icone: '🏃' },
  { rota: '#/checkin', rotulo: 'Check-in', icone: '✅' },
  { rota: '#/quadro', rotulo: 'Quadro', icone: '🩺' },
  { rota: '#/mais', rotulo: 'Mais', icone: '☰' },
];

function ir(rota: string): void {
  if (location.hash === rota) render();
  else location.hash = rota;
}

function tela(rota: string): HTMLElement {
  const [, a, b, c] = rota.split('/');
  switch (a) {
    case 'corrida': {
      const p = CRONOGRAMA[estado.config.semanaAtual - 1]!;
      return lista('corridas', {
        titulo: 'Corrida',
        topo: [h('div', { class: 'cartao' }, h('strong', null, `Semana ${p.semana}: ${p.aerobico}`),
          h('p', { class: 'mudo' }, 'Ritmo em que dá para conversar, sem meta de pace. Antes do treino C, só caminhada inclinada leve.'))],
      });
    }
    case 'checkin':
      return telaCheckin(render);
    case 'quadro':
      return lista('evolucao', {
        titulo: 'Evolução do quadro',
        topo: [
          h('p', { class: 'mudo' }, 'Registre sempre que algum sintoma mudar.'),
          caixaAlerta('emergencia', TEXTO_EMERGENCIA),
          caixaAlerta('cirurgiao', TEXTO_CIRURGIAO),
        ],
      });
    case 'mais':
      switch (b) {
        case 'backup': return telaBackup(render);
        case 'cargas': return telaCargas(render);
        case 'plano': return telaPlano();
        case 'ajustes': return telaAjustes(render);
        case 'historico': return lista('registros', { voltar: '#/mais' });
        case 'fisio': return lista('fisio', { voltar: '#/mais' });
        case 'composicao': return lista('composicao', { voltar: '#/mais' });
        default: return telaMais();
      }
    case 'editar':
      if (STORES.includes(b as StoreName) && c) return editar(b as StoreName, c, ir);
      return telaHoje(render);
    default:
      return telaHoje(render);
  }
}

function render(): void {
  const rota = location.hash || '#/hoje';
  const raiz = '#/' + (rota.split('/')[1] ?? 'hoje');
  const rolagem = window.scrollY;
  const mesmaTela = app.dataset.rota === rota;
  app.replaceChildren(
    h('main', null, tela(rota)),
    h(
      'nav',
      { class: 'abas', 'aria-label': 'Navegação' },
      ABAS.map((x) =>
        h('a', { href: x.rota, class: x.rota === raiz ? 'ativa' : '', 'aria-current': x.rota === raiz ? 'page' : null },
          h('span', { class: 'icone', 'aria-hidden': 'true' }, x.icone), h('span', null, x.rotulo)),
      ),
    ),
  );
  app.dataset.rota = rota;
  window.scrollTo(0, mesmaTela ? rolagem : 0);
}

function avisoAtualizacao(reg: ServiceWorkerRegistration): void {
  const mostrar = (w: ServiceWorker) => {
    if (document.getElementById('atualizar')) return;
    document.body.append(
      h('div', { id: 'atualizar', class: 'faixa' }, 'Nova versão do app disponível.',
        h('button', { class: 'btn mini primario', onclick: () => w.postMessage('ATUALIZAR') }, 'Atualizar')),
    );
  };
  if (reg.waiting && navigator.serviceWorker.controller) mostrar(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w?.addEventListener('statechange', () => {
      if (w.state === 'installed' && navigator.serviceWorker.controller) mostrar(w);
    });
  });
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recarregou) return;
    recarregou = true;
    location.reload();
  });
}

async function iniciar(): Promise<void> {
  try {
    await carregar();
  } catch (e) {
    app.replaceChildren(caixaAlerta('emergencia', 'Não foi possível abrir o banco local: ' + (e as Error).message));
    return;
  }
  window.addEventListener('hashchange', render);
  render();
  void navigator.storage?.persist?.();
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      avisoAtualizacao(reg);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void reg.update();
      });
    } catch (e) {
      console.warn('Service worker não registrado', e);
    }
  }
}

void iniciar();
