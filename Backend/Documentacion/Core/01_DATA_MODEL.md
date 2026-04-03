# CORE: DATA MODEL (Modelado de Dominio)

## Propósito
Este documento define las entidades fundamentales de SuniPlayer. Es la fuente de verdad para la estructura de datos que fluye a través de los stores y se persiste en el almacenamiento local.

## Entidades Principales

### 1. TRACK (La Unidad Atómica)
Representa una canción y toda su metadata técnica y musical.
- **Identificadores**: `id` (UUID) e `instanceId` (para evitar colisiones en listas React).
- **Metadata Básica**: `title`, `artist`, `duration_ms`.
- **Atributos Musicales**:
    - `bpm`: Tempo detectado o ajustado.
    - `key`: Tonalidad armónica.
    - `energy`: Nivel de intensidad (0.0 - 1.0).
    - `mood`: Categorización emocional (calm, happy, etc.).
- **Configuración de Performance**:
    - `startTime` / `endTime`: Puntos de recorte (Trims).
    - `gainOffset`: Compensación de volumen en dB.
    - `markers`: Array de `TrackMarker` para señalización en la waveform.
    - `sheetMusic`: Referencias a archivos de partituras/letras vinculados.
- **Estado de Almacenamiento**:
    - `file_path`: Ruta al binario (si es nativo).
    - `blob_url`: URL temporal para el motor de audio web.
    - `isCustom`: Indica si fue importado por el usuario.

### 2. SHOW y SET (La Estructura Organizativa)
Define cómo se agrupan los tracks para una performance.
- **SET ENTRY**: Un conjunto de tracks con una etiqueta y duración calculada. Es la unidad que genera el **Builder**.
- **SHOW**: La entidad de nivel superior que agrupa uno o varios sets. Representa un evento completo (ej: "Boda Juan y Maria").
- **SET HISTORY ITEM**: Extensión de Show que incluye metadata del contexto de generación (`venue`, `curve`, `target duration`).

### 3. MARKER (Señalización en Tiempo Real)
```typescript
{
  id: string;
  posMs: number;    // Posición exacta en el tiempo de audio
  comment: string;  // Etiqueta visual para el músico
}
```

## Relaciones y Flujo
1. Los **Tracks** viven en la `Library`.
2. El **Builder** selecciona tracks de la librería y crea un `genSet` (un array de Tracks).
3. Al iniciar el show, el `genSet` se convierte en el `pQueue` (cola activa) del **Player**.
4. Al finalizar, el show se guarda en el **History** para futura referencia.

---
*El Data Model de SuniPlayer está diseñado para ser extensible, permitiendo que un track evolucione de un simple archivo a un activo musical inteligente.*
