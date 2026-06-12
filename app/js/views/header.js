// Shared app header: back, title, centered show chronometer, and
// always-visible Edit/Show mode shortcuts (no hamburgers, no hidden menus).
import { h } from '../ui.js';
import { state } from '../player.js';
import { navigate } from '../app.js';

export function appHeader({ title, backTo = null, actions = [], hideModes = false }) {
  const modeBtns = hideModes ? null : h('div', { class: 'mode-switch' },
    h('button', {
      class: `btn small mode-btn ${state.mode === 'edit' ? 'active' : ''}`,
      onclick: () => navigate('edit'),
      title: 'Modo Edit',
    }, '✏️ Edit'),
    h('button', {
      class: `btn small mode-btn ${state.show.active ? 'live' : ''}`,
      onclick: () => navigate(state.show.active ? 'show' : 'edit'),
      title: state.show.active ? 'Volver al show en vivo' : 'Iniciar show (desde Edit)',
    }, state.show.active ? '🔴 Show' : '🎯 Show'),
  );

  return h('header', { class: 'view-header' },
    backTo ? h('button', { class: 'btn-icon', onclick: () => navigate(backTo), 'aria-label': 'Volver' }, '←') : null,
    h('h1', {}, title),
    h('span', { class: 'hdr-chrono', id: 'hdr-chrono' }),
    ...actions,
    modeBtns,
  );
}
