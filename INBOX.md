# INBOX — Bugs e ideas del dueño del producto

> Omar escribe acá lo que encuentra usando la app. Una línea por ítem, en
> lenguaje humano, sin tecnicismos. Claude (arquitecto) triagea cada entrada:
> la convierte en contrato + tarea en la cola de STATUS.md y la mueve a
> "Triageado". NADIE implementa directo desde este archivo.

## Cómo reportar (formato libre, pero esto ayuda)

- BUG: qué hiciste, qué esperabas, qué pasó. Ej: "BUG: le di pausa y siguió sonando"
- IDEA: qué querés y para qué. Ej: "IDEA: ordenar la librería por artista"
- Si hay error en pantalla o en la consola del navegador (F12), pegalo tal cual.

## Nuevos (Claude los lee acá)

(vacío — escribí debajo de esta línea)

## Triageado (movido por Claude, con destino)

- BUG: "importé un mp3, le di click y no suena nada" → ya cubierto por #ctp-polish en la cola (bug de AudioContext suspendido por autoplay policy; contrato en Engram sdd/ctp-polish/tasks) — 2026-06-11
- IDEA: "quiero ver la forma de onda de la canción para ubicarme" → #waveform encolado (contrato en Engram sdd/waveform/tasks, según spec docs/componentes/06-grafica-ondas.md; incluye seek por gesto y bloqueo en Modo Show) — 2026-06-11
