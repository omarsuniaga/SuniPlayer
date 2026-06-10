# Sistema de Tema (Dark/Light)

## ¿Qué es?

El sistema de **apariencia visual** de Suniplayer. Permite al usuario elegir entre un tema oscuro y uno claro, o seguir automáticamente la configuración del sistema operativo.

---

## Modos disponibles

| Modo | Descripción |
|------|-------------|
| 🌙 Oscuro (Dark) | Fondo oscuro, texto claro. Ideal para escenarios con poca luz. |
| ☀️ Claro (Light) | Fondo claro, texto oscuro. Ideal para leer partituras o usar al aire libre. |
| 🔄 Seguir sistema | Usa la configuración del sistema operativo del dispositivo. |

---

## ¿Qué cambia cuando cambia el tema?

**No solo cambia el color de fondo.** Cambian todos los aspectos visuales de la app:

### Colores

| Elemento | Dark | Light |
|----------|------|-------|
| Fondo principal | #121212 (casi negro) | #FFFFFF (blanco) |
| Fondo secundario (tarjetas) | #1E1E1E | #F5F5F5 |
| Texto principal | #FFFFFF | #121212 |
| Texto secundario | #B0B0B0 | #666666 |
| Acento (botones, enlaces) | Color del usuario (ej: #4FC3F7) | Mismo acento |
| Bordes | #333333 | #E0E0E0 |
| Sombra de tarjetas | Sutil (casi sin sombra) | Más notoria |

### Componentes visuales

| Componente | Dark | Light |
|------------|------|-------|
| Waveform (gráfica) | Verde/azul neón brillante | Color oscuro sobre fondo claro |
| Botones de control | Blancos sobre fondo oscuro | Oscuros sobre fondo claro |
| Cronómetro de Show | Blanco grande, fondo rojo tenue | Mismo estilo, fondo rojo más saturado |
| Menús y modales | Fondo oscuro, bordes sutiles | Fondo claro, bordes definidos |
| Scrollbars | Delgadas, color acento | Delgadas, grises |

### Ilustraciones y gráficos

- Las ilustraciones (si las hay) deben tener versión para ambos temas.
- Las portadas de canciones no se alteran (son archivos del usuario).

---

## Configuración

| Opción | Default | Dónde se configura |
|--------|---------|-------------------|
| Modo de tema | Seguir sistema | Perfil → Tema |
| Transición entre temas | 300ms (animación suave) | No configurable |

**Comportamiento:**
- El cambio de tema es **instantáneo** (con animación suave de 300ms).
- La preferencia se guarda en la DB local.
- Si está en "Seguir sistema", la app escucha cambios del SO y se adapta automáticamente.

---

## Impacto en otros componentes

| Componente | Qué cambia según el tema |
|-----------|--------------------------|
| Gráfica de ondas | Color de la onda y del cabezal |
| Reproductor | Color de fondo de la vista |
| Editor de sets | Contraste de la lista de canciones |
| Modo Show | En Show, el tema debería ser siempre OSCURO (para el escenario) |
| Partituras | El fondo de la partitura NO cambia (es el archivo mismo) — lo que cambia es el fondo y la UI alrededor |

---

## Comportamiento especial en modo Show

En modo Show, el tema se fuerza a **Oscuro** independientemente de la preferencia del usuario:

```text
Razón:
- En un escenario, la luz blanca de un tema claro desentona y molesta.
- El modo Show es performance, no navegación.
- La audiencia ve la luz de la pantalla del músico — mejor que sea tenue.
```

Al salir del modo Show, se restaura la preferencia original del usuario.

---

## Relación con otros componentes

| Componente | Relación |
|-----------|----------|
| Toda la UI | El tema es global, afecta absolutamente todo |
| Vista Perfil | Es donde se configura el tema |
| Modo Show | El tema se fuerza a oscuro durante el show |

---

## Estados

| Estado | Comportamiento |
|--------|---------------|
| Dark activo | App en modo oscuro |
| Light activo | App en modo claro |
| Siguiendo sistema | Depende del SO del dispositivo |
| Forzado (Show) | Oscuro, independientemente de la preferencia |
