# Mirror (Cámara superpuesta)

## ¿Qué es?

Un componente que activa la **cámara del dispositivo** y la muestra como una **ventana superpuesta** sobre la interfaz. El músico puede verse a sí mismo mientras toca.

---

## Tres modos de visualización

### Modo 1: Mini (esquina flotante)

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│           ┌──────────────────────┐                           │
│           │  ┌──┐               │  ← botón ✕ cerrar         │
│           │  │🎥│               │  ← botón 🔄 cámara        │
│           │  └──┘               │                           │
│           │                     │                           │
│           │   📷 FEED DE        │                           │
│           │   CÁMARA            │                           │
│           │   (120x160px)      │                           │
│           │                     │                           │
│           │   ≣ (arrastrar)     │                           │
│           └──────────────────────┘                           │
│                                                              │
│  [Controles de reproducción...]                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Tamaño: ~120x160px.
- **Arrastrable** a cualquier posición de la pantalla.
- Botón ✕ para cerrar, 🎥 para cambiar cámara frontal/trasera.
- ≣ para arrastrar.
- Permanece visible al navegar entre vistas.

### Modo 2: Medio (mitad de pantalla)

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌────────────────────────────────────────────────────────┐│
│   │                                                        ││
│   │                📷  CÁMARA                              ││
│   │                                                        ││
│   │          [ocupa el 50% superior]                       ││
│   │                                                        ││
│   │                   ──┐                                  ││
│   │  [✕]           [🔄] │ ← minimizar a mini              ││
│   └────────────────────────────────────────────────────────┘│
│                                                              │
│   ────────────────────────────────────────────────────────── │
│                                                              │
│   [⏮️]  [▶⏸]  [⏭️]           ♫  Salsa Brava                │
│   Vol: ────●══════───         03:45 / 03:45                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Ideal para modo Show (el músico se ve grande mientras toca).
- Se puede mover entre mitad superior o inferior.
- Los controles quedan en la mitad opuesta.

### Modo 3: PIP (Picture-in-Picture del SO)

```text
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │   SUNIPLAYER                                           │
  │                                                        │
  │   ♫  Sonando: Salsa Brava                              │
  │                                                   ┌──┐ │
  │   ▶⏸   ⏭️    ⏮️                                  │📷│ │
  │                                                  └──┘ │
  │   [feed de cámara flotando como PIP]                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  (si el SO lo soporta, la ventana PIP flota sobre otras apps)
```

---

## Controles del mirror

```text
┌──────────────────────────────────────────────────────────────┐
│                      CONTROLES DEL MIRROR                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✕  Cerrar          →  Apaga la cámara completamente        │
│  🔄 Cambiar cámara  →  Frontal ↔ Trasera                    │
│  📍 Mover           →  Arrastrar a otra posición            │
│  ⬜ Expandir         →  Mini → Medio → (Completo no hay)     │
│  ─ Contraer         →  Medio → Mini                         │
│  📌 Fijar           →  No se mueve al navegar               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Configuración

```text
┌─────── CONFIGURACIÓN DEL MIRROR ───────────────────────────┐
│                                                              │
│  Cámara por defecto:  [📱 Frontal]  [📷 Trasera]           │
│                                                              │
│  Modo por defecto:     [Mini]  [Medio]  [PIP]               │
│                                                              │
│  [✓] Espejado (imagen invertida como espejo real)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Privacidad

```text
  🔒  La cámara solo se activa cuando el usuario toca el botón.
  🔒  Suniplayer NO graba ni almacena el video.
  🔒  Al cerrar el mirror, la cámara se apaga completamente.
  🔒  Indicador 🟢 en barra superior: "Cámara activa".

  ⚠️  Sin permiso de cámara → el mirror no funciona.
      Mensaje: "Suniplayer necesita permiso para usar la cámara."
```

---

## Estados

```text
┌─────────────────┬────────────────────────────────────────────┐
│  Estado         │  Comportamiento                            │
├─────────────────┼────────────────────────────────────────────┤
│  Desactivado    │  Cámara apagada, sin indicador.            │
├─────────────────┼────────────────────────────────────────────┤
│  Mini           │  Ventana flotante 120x160, arrastrable.    │
├─────────────────┼────────────────────────────────────────────┤
│  Medio          │  Ocupa 50% de la pantalla.                 │
├─────────────────┼────────────────────────────────────────────┤
│  PIP            │  Feed fuera de la app (si el SO lo soporta)│
├─────────────────┼────────────────────────────────────────────┤
│  Error cámara   │  "No se pudo acceder a la cámara.          │
│                 │  Revisá los permisos."                     │
├─────────────────┼────────────────────────────────────────────┤
│  Permiso deneg. │  "Suniplayer necesita permiso para         │
│                 │  usar la cámara."                          │
└─────────────────┴────────────────────────────────────────────┘
```
