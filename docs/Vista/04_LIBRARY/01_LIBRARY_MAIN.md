# VISTA: BIBLIOTECA (Command Center)

## Propósito
La **Biblioteca** es el centro de mando para la ingesta y curaduría del catálogo. Su misión es permitir al músico gestionar su colección de audios y preparar el repertorio para el algoritmo de generación.

## 🏗️ Interfaz Cockpit (v2.0)
Diseñada para alta densidad de información y operación rápida:
- **Layout Fijo**: Pantalla completa sin scroll externo (`100dvh`).
- **Header Comprimido**: Buscador elástico y filtros rápidos (Todos/Local).
- **Filas de 40px**: Visualización técnica de Título, Artista, **BPM** y **Key** en una sola línea.
- **Zonas de Seguridad**: Desvanecimiento (fade) inferior para evitar colisiones con el mini-reproductor.

## 🛠️ Funcionalidades Pro
1. **Modo Batch (Selección Masiva)**: 
    - Selección mediante checkboxes laterales o "Seleccionar Todo".
    - Barra de acciones cian para: Borrado masivo y Habilitación masiva para el Generador.
2. **Flag de Algoritmo (Cerebro 🧠)**: 
    - Permite incluir/excluir temas del **Repertorio Estratégico** con un solo clic. Solo temas con el cerebro activo son usados por el Builder.
3. **Ingesta Inteligente**: 
    - Importación híbrida: Audio a **OPFS** y Metadata a **IndexedDB**.
    - Análisis automático de BPM, Key y Energía al importar.

## 🎨 Estética y UX
- **Colores**: Fondo negro puro (`#050508`), acentos en Cian (`#00FFFF`) para datos técnicos.
- **Mobile-First**: Touch targets de 48px en dispositivos móviles con reubicación automática de botones.

---
*La Biblioteca es ahora una herramienta de curaduría de datos profesional.*
