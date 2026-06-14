// Small DOM + formatting helpers shared by all views.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v === true ? '' : v);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(child));
  }
  return el;
}

export function fmtTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const hr = Math.floor(m / 60);
  if (hr > 0) return `${hr}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function fmtBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- Modal system ----
export function openModal(title, bodyEl, actions = []) {
  closeModal();
  const overlay = h('div', { class: 'modal-overlay', id: 'modal-overlay' });
  const footer = actions.length
    ? h('div', { class: 'modal-footer' },
      ...actions.map(a => h('button', {
        class: `btn ${a.kind || ''}`,
        onclick: () => { if (a.onClick) a.onClick(); if (a.close !== false) closeModal(); },
      }, a.label)))
    : null;
  const modal = h('div', { class: 'modal' },
    h('div', { class: 'modal-header' },
      h('h3', {}, title),
      h('button', { class: 'btn-icon', onclick: closeModal, 'aria-label': 'Cerrar' }, '✕')),
    h('div', { class: 'modal-body' }, bodyEl),
    footer,
  );
  overlay.append(modal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.append(overlay);
  return modal;
}

export function closeModal() {
  document.getElementById('modal-overlay')?.remove();
}

export function confirmModal(title, message, confirmLabel = 'Confirmar') {
  return new Promise(resolve => {
    openModal(title, h('p', { class: 'modal-message' }, message), [
      { label: 'Cancelar', onClick: () => resolve(false) },
      { label: confirmLabel, kind: 'danger', onClick: () => resolve(true) },
    ]);
  });
}

// ---- Toast ----
let toastTimer = null;
export function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', class: 'toast' });
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2400);
}
