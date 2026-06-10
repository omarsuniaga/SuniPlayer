---
ruta: docs/componentes/16-ecualizador.md
tipo: componente
origen: "[[01-audio-engine]]"
estado: estable
---

# Ecualizador (EQ)

## Función

Procesar un stream de audio aplicando ganancia o atenuación sobre bandas de frecuencia específicas (3 a 5 bandas) utilizando nodos Web Audio API (BiquadFilterNode); y devolver el flujo ecualizado en tiempo real al motor de audio.

## Entrada

- Nodo de audio/buffer de origen y ganancias de banda (dB) ← [[01-audio-engine]]

## Proceso

1. **Inserción en la Cadena de Audio:** El ecualizador se conecta en serie en la cadena de procesamiento de [[01-audio-engine]]:
   `Pitch Shifter ➔ Time Stretcher ➔ Ecualizador (EQ) ➔ Fade Engine ➔ Salida física`.
2. **Bandas Frecuenciales:** Configura 3 o 5 filtros en serie utilizando la Web Audio API:
   - **Banda de Graves (Low Shelf):** Frecuencia de corte ~100Hz.
   - **Banda de Medios-Graves (Peaking):** Frecuencia central ~400Hz.
   - **Banda de Medios (Peaking):** Frecuencia central ~1000Hz (1kHz).
   - **Banda de Medios-Agudos (Peaking):** Frecuencia central ~3000Hz (3kHz).
   - **Banda de Agudos (High Shelf):** Frecuencia de corte ~8000Hz (8kHz).
3. **Control y Persistencia:** El usuario arrastra los controles en la vista del reproductor (ganancia -10dB a +10dB). Los cambios se aplican de inmediato en caliente y se persisten en la base de datos de almacenamiento, vinculados al ID del track o de forma global según la preferencia.

## Salida

- Buffer de audio con ecualización aplicada → [[01-audio-engine]]
- Preferencias de ganancia de bandas para persistir → [[04-almacenamiento]]

## Errores

- **Lógico:** el nodo de audio entrante no está inicializado o la Web Audio API es inaccesible en el navegador.
  - *Resolución:* El componente entra en modo bypass, pasando el buffer original sin modificaciones para evitar cortes de audio.
- **Semántico:** los valores de ganancia de las bandas exceden el rango físico permitido (-10dB a +10dB).
  - *Resolución:* Se truncan los valores a los límites y se notifica el error.

Catálogo global: [[07-modelo-errores]]
