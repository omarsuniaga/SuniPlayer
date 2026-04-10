// packages/core/src/network/clockSyncService.ts
import { ClockOffset, NTPSample, SyncStatus } from './types';

/**
 * ClockSyncService — Protocolo NTP adaptado para sincronía multi-dispositivo.
 * Calcula el offset entre el reloj local y el del líder del ensamble.
 */
export class ClockSyncService {
    private samples: NTPSample[] = [];
    private currentOffset: ClockOffset | null = null;
    private status: SyncStatus = 'UNCALIBRATED';
    
    // Configuración según el Dev Kit
    private readonly INITIAL_SAMPLES = 10;
    private readonly RECALIBRATION_SAMPLES = 5;
    private readonly MAX_STD_DEV_MS = 2;
    private readonly EMA_ALPHA = 0.3; // Factor de suavizado (0.3 = 30% nueva muestra, 70% historia)

    /** Obtiene el tiempo monótono actual en milisegundos */
    public now(): number {
        return performance.now();
    }

    /** Procesa una respuesta PONG del líder para calcular una muestra */
    public addSample(t1: number, t2: number, t3: number): void {
        const t4 = this.now();
        
        // RTT = (T4 - T1) - (T3 - T2)
        const rtt = (t4 - t1) - (t3 - t2);
        
        // Offset = ((T2 - T1) + (T3 - T4)) / 2
        const offset = ((t2 - t1) + (t3 - t4)) / 2;

        this.samples.push({ t1, t2, t3, t4, offset, rtt });

        // Si alcanzamos el número de muestras, calculamos el offset final
        const requiredSamples = this.status === 'UNCALIBRATED' ? this.INITIAL_SAMPLES : this.RECALIBRATION_SAMPLES;
        
        if (this.samples.length >= requiredSamples) {
            this.calculateFinalOffset();
        }
    }

    private calculateFinalOffset(): void {
        // 1. Filtrado de Mediana (Eliminar el 20% superior de RTT según el kit)
        const sortedByRtt = [...this.samples].sort((a, b) => a.rtt - b.rtt);
        const filteredCount = Math.ceil(this.samples.length * 0.8);
        const bestSamples = sortedByRtt.slice(0, filteredCount);

        // 2. Calcular Mediana del Offset de esta ráfaga de muestras
        const offsets = bestSamples.map(s => s.offset).sort((a, b) => a - b);
        const burstMedianOffset = offsets[Math.floor(offsets.length / 2)];

        // 3. Aplicar EMA para suavizar el offset final si ya estamos sincronizados
        let finalOffsetMs = burstMedianOffset;
        if (this.currentOffset && this.status === 'SYNCED') {
            finalOffsetMs = (burstMedianOffset * this.EMA_ALPHA) + (this.currentOffset.offsetMs * (1 - this.EMA_ALPHA));
        }

        // 4. Calcular Desviación Estándar (Calidad de la ráfaga)
        const avgOffset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
        const stdDev = Math.sqrt(
            offsets.map(o => Math.pow(o - avgOffset, 2)).reduce((a, b) => a + b, 0) / offsets.length
        );

        this.currentOffset = {
            offsetMs: finalOffsetMs,
            rttMs: bestSamples.reduce((a, b) => a + b.rtt, 0) / bestSamples.length,
            sampleCount: bestSamples.length,
            stdDevMs: stdDev,
            calibratedAt: Date.now()
        };

        // 5. Determinar Estado
        if (stdDev <= this.MAX_STD_DEV_MS) {
            this.status = 'SYNCED';
            console.log(`[ClockSync] Sincronizado. Offset: ${finalOffsetMs.toFixed(2)}ms (Burst Median: ${burstMedianOffset.toFixed(2)}ms), StdDev: ${stdDev.toFixed(2)}ms`);
        } else {
            this.status = 'DRIFTING';
            console.warn(`[ClockSync] Desviación alta (${stdDev.toFixed(2)}ms). Requiere recalibración.`);
            this.samples = []; 
        }

        // Limpiar muestras para la próxima calibración
        this.samples = [];
    }

    /** Convierte un timestamp del líder a tiempo local */
    public leaderToLocal(leaderTimestampMs: number): number {
        if (!this.currentOffset) return leaderTimestampMs;
        // LocalTime = LeaderTime + Offset
        // (Si el offset es positivo, el local está adelantado)
        return leaderTimestampMs - this.currentOffset.offsetMs;
    }

    /** Convierte tiempo local a tiempo del líder */
    public localToLeader(localTimestampMs: number): number {
        if (!this.currentOffset) return localTimestampMs;
        return localTimestampMs + this.currentOffset.offsetMs;
    }

    public getOffset(): ClockOffset | null {
        return this.currentOffset;
    }

    public forceRecalibrate(): void {
        this.status = 'UNCALIBRATED';
        this.samples = [];
        console.log('[ClockSync] Recalibración manual iniciada.');
    }

    public getStatus(): SyncStatus {
        return this.status;
    }

    public reset(): void {
        this.samples = [];
        this.currentOffset = null;
        this.status = 'UNCALIBRATED';
    }
}

export const clockSyncService = new ClockSyncService();
