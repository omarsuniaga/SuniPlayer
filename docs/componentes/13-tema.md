---
ruta: docs/componentes/13-tema.md
tipo: componente
origen: "[[06-vista-perfil]]"
estado: estable
---

# Sistema de Tema (Dark/Light)

## Función

Administrar la apariencia visual de la aplicación (Modos Oscuro, Claro y Sistema); aplicar clases globales y variables CSS al DOM con transiciones suaves; y forzar el Modo Oscuro durante el Modo Show por razones de discreción en el escenario.

## Entrada

- Selección manual de tema por parte del usuario ← [[06-vista-perfil]]
- Preferencia de tema del sistema operativo (Media Query `prefers-color-scheme`) (físico)

## Proceso

1. **Selección del Tema:** El componente lee la preferencia del usuario guardada en la base de datos. Si está en "Seguir sistema", escucha eventos de cambio del SO.
2. **Aplicación de Estilos CSS:** Modifica las variables de CSS custom properties (`--bg-primary`, `--text-primary`, `--accent`) en el elemento `:root` del documento. Aplica una transición global de 300ms.
3. **Optimización de Contraste para Componentes:**
   - En Modo Oscuro, la [grafica-ondas](file:///C:/Users/omare/OneDrive/Documentos/SUNIPLAYER_V2/docs/componentes/06-grafica-ondas.md) se dibuja en verde/azul neón sobre fondo negro.
   - En Modo Claro, la gráfica se dibuja en color oscuro sobre fondo blanco.
   - Las partituras en [[09-partituras]] no se alteran en sí mismas (son archivos PDF/imágenes del usuario), pero el contenedor y la UI que las rodea se ajustan al tema.
4. **Forzado en Modo Show:** Al activarse el Modo Show, el sistema ignora temporalmente el tema seleccionado y fuerza el **Modo Oscuro** (clase `.theme-dark-forced`) para evitar contaminación lumínica en el escenario. Al salir del show, restaura el tema previo.

## Salida

- Persistencia de la preferencia de tema → [[04-almacenamiento]]
- Estilos aplicados en el DOM para todas las pantallas (cada vista declara `← [[13-tema]]`) → todas las vistas

## Errores

- **Lógico:** el dispositivo no soporta la media query del sistema — se fuerza el Modo Oscuro por defecto.
- **Semántico:** intentar cambiar el tema mientras el Modo Show está activo — la operación se bloquea visualmente y el interruptor permanece deshabilitado.

Catálogo global: [[07-modelo-errores]]

---

## Modos disponibles

- **🌙 Oscuro (Dark):** Fondo oscuro, texto claro. Ideal para escenarios con poca luz.
- **☀️ Claro (Light):** Fondo claro, texto oscuro. Ideal para leer partituras o usar al aire libre.
- **🔄 Seguir sistema:** Usa la configuración del sistema operativo del dispositivo.

---

## Qué cambia cuando cambia el tema

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

- **Waveform (gráfica):** Verde/azul neón brillante en Dark; oscuro sobre fondo claro en Light.
- **Botones de control:** Blancos sobre fondo oscuro en Dark; oscuros sobre fondo claro en Light.
- **Cronómetro de Show:** Blanco grande sobre fondo rojo tenue en Dark; mismo estilo con fondo rojo más saturado en Light.
- **Menús y modales:** Fondo oscuro, bordes sutiles en Dark; fondo claro, bordes definidos en Light.
- **Scrollbars:** Delgadas y en color acento en Dark; delgadas y grises en Light.
- **Ilustraciones:** Poseen versiones específicas adaptadas a cada tema.
- **Partituras:** El fondo de la partitura NO cambia (es el archivo mismo). Cambia el fondo y la UI del contenedor.
