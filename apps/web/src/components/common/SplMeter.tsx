import React, { useEffect, useRef, useState } from "react";
import { THEME } from "../../data/theme";

interface SplMeterProps {
    target: "studio" | "small" | "hall" | "open";
    expanded: boolean;
    onToggleExpand: () => void;
}

const TARGET_LEVELS = {
    studio: { ideal: 75, warn: 85, max: 95, label: "Estudio Reference" },
    small: { ideal: 80, warn: 90, max: 100, label: "Recinto Cerrado" },
    hall: { ideal: 90, warn: 100, max: 110, label: "Auditorio/SalÃ³n" },
    open: { ideal: 100, warn: 110, max: 120, label: "Espacio Abierto" }
};

const SMOOTHING_BUFFER_SIZE = 60; // For the stable bar
const FAST_SMOOTHING = 0.3; // For the oscillating numbers

export const SplMeter: React.FC<SplMeterProps> = ({ target, expanded, onToggleExpand }) => {
    const [avgLevel, setAvgLevel] = useState(30);
    const [fastLevel, setFastLevel] = useState(30);
    const [peak, setPeak] = useState(30);
    const [permission, setPermission] = useState<"pending" | "granted" | "denied">("pending");
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number>(0);
    const bufferRef = useRef<number[]>([]);

    const config = TARGET_LEVELS[target];

    useEffect(() => {
        const startMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStreamRef.current = stream;
                
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const ctx = new AudioContextClass();
                audioContextRef.current = ctx;
                
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.2;
                analyserRef.current = analyser;
                
                const source = ctx.createMediaStreamSource(stream);
                source.connect(analyser);
                
                setPermission("granted");
                update();
            } catch (err) {
                console.error("Mic access denied", err);
                setPermission("denied");
            }
        };

        const update = () => {
            if (!analyserRef.current) return;
            const data = new Float32Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getFloatTimeDomainData(data);
            
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                sum += data[i] * data[i];
            }
            const rms = Math.sqrt(sum / data.length);
            const rawDb = 20 * Math.log10(rms || 0.0001) + 100;
            const db = Math.max(30, Math.min(120, rawDb));

            // Stable buffer for visual bar
            bufferRef.current.push(db);
            if (bufferRef.current.length > SMOOTHING_BUFFER_SIZE) {
                bufferRef.current.shift();
            }
            const currentAvg = bufferRef.current.reduce((a, b) => a + b, 0) / bufferRef.current.length;
            
            setAvgLevel(prev => prev + (currentAvg - prev) * 0.1); 
            setFastLevel(prev => prev + (db - prev) * FAST_SMOOTHING); // Faster for "oscillation"
            setPeak(prev => Math.max(prev * 0.995, db));
            
            rafRef.current = requestAnimationFrame(update);
        };

        startMic();

        return () => {
            cancelAnimationFrame(rafRef.current);
            micStreamRef.current?.getTracks().forEach(t => t.stop());
            audioContextRef.current?.close();
        };
    }, []);

    const getLevelColor = (val: number) => {
        if (val >= config.warn) return "#ff4d4d";
        if (val >= config.ideal) return "#ffd11a";
        return THEME.colors.brand.cyan;
    };

    if (permission === "denied") {
        return (
            <div style={{ 
                padding: "12px 16px", borderRadius: THEME.radius.lg, 
                background: "rgba(255, 77, 77, 0.05)", border: "1px solid rgba(255, 77, 77, 0.2)", 
                fontSize: 12, color: "#ff4d4d", display: "flex", alignItems: "center", gap: 8 
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 9 2V5l-9-2-9 2v10"/><path d="M12 3v18"/></svg>
                Habilita el MicrÃ³fono para medir decibelios.
            </div>
        );
    }

    // Logic for visibility: Show numbers only if within/above range
    const showNumbers = fastLevel >= config.ideal;
    const displayLevel = avgLevel; // Use smooth for bar and state decision
    const color = getLevelColor(displayLevel);
    const pct = ((displayLevel - 30) / (120 - 30)) * 100;
    const peakPct = ((peak - 30) / (120 - 30)) * 100;

    return (
        <div style={{
            margin: "8px 0",
            padding: expanded ? "20px" : "12px 20px",
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(10px)",
            borderRadius: THEME.radius.xl,
            border: `1px solid ${displayLevel > config.warn ? color + "60" : THEME.colors.border}`,
            display: "flex",
            flexDirection: "column",
            gap: expanded ? 16 : 8,
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            overflow: "hidden",
            boxShadow: displayLevel > config.max ? `0 0 30px ${color}20` : "none"
        }}>
            {/* Top Shine */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />

            {/* Main Display Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative" }}>
                        <div style={{ 
                            fontSize: expanded ? 36 : 24, 
                            fontWeight: 900, 
                            color: showNumbers ? color : THEME.colors.text.muted + "40", 
                            fontFamily: THEME.fonts.mono,
                            textShadow: showNumbers ? `0 0 20px ${color}40` : "none",
                            transition: "all 0.4s",
                            opacity: showNumbers ? 1 : 0.3
                        }}>
                            {showNumbers ? Math.round(fastLevel) : "--"}
                        </div>
                        {showNumbers && (
                            <div style={{ 
                                position: "absolute", top: -8, right: -12, 
                                width: 6, height: 6, borderRadius: "50%", 
                                backgroundColor: color, 
                                animation: "pulse 1.5s infinite" 
                            }} />
                        )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: expanded ? 14 : 11, fontWeight: 800, color: THEME.colors.text.secondary }}>dB SPL</span>
                        {!expanded && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: THEME.colors.text.muted, textTransform: "uppercase" }}>{config.label}</span>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {expanded && (
                        <div style={{ textAlign: "right", paddingRight: 16, borderRight: `1px solid ${THEME.colors.border}` }}>
                            <div style={{ fontSize: 9, fontWeight: 900, color: THEME.colors.text.muted, letterSpacing: 1 }}>PEAK LEVEL</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: getLevelColor(peak), fontFamily: THEME.fonts.mono, opacity: showNumbers ? 1 : 0.5 }}>
                                {showNumbers ? Math.round(peak) : "--"}
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={onToggleExpand}
                        style={{ 
                            background: "rgba(255,255,255,0.08)", 
                            border: "none", 
                            borderRadius: THEME.radius.md, 
                            width: 32, height: 32,
                            cursor: "pointer",
                            color: THEME.colors.text.secondary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {expanded ? <path d="m18 15-6-6-6 6"/> : <path d="m6 9 6 6 6-6"/>}
                        </svg>
                    </button>
                </div>
            </div>

            {expanded && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1.5 }}>
                         Entorno: <span style={{ color: color }}>{config.label}</span>
                    </div>
                    <div style={{ fontSize: 9, color: THEME.colors.text.muted, opacity: 0.5, fontStyle: "italic" }}>
                        {showNumbers ? "MÃXIMA PRECISIÃ“N ACTIVA" : "AGUARDANDO NIVEL DE REFERENCIA..."}
                    </div>
                </div>
            )}

            {/* Premium Meter Bar (Always visible graphically) */}
            <div style={{ 
                height: expanded ? 14 : 8, 
                backgroundColor: "rgba(0,0,0,0.2)", 
                borderRadius: 7, 
                position: "relative", 
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.03)",
                transition: "all 0.3s"
            }}>
                {/* Scale Markers */}
                {[0.25, 0.5, 0.75].map(m => (
                    <div key={m} style={{ position: "absolute", left: `${m * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.05)", zIndex: 1 }} />
                ))}

                {/* Target Zone Indicators */}
                <div style={{ position: "absolute", left: `${((config.ideal - 30) / 90) * 100}%`, top: 0, bottom: 0, width: 2, backgroundColor: "rgba(255,255,255,0.15)", zIndex: 2 }} title="Nivel Ideal" />
                <div style={{ position: "absolute", left: `${((config.warn - 30) / 90) * 100}%`, top: 0, bottom: 0, width: 2, backgroundColor: "#ff4d4d40", zIndex: 2 }} title="Advertencia" />
                
                {/* Main Fill */}
                <div style={{
                    height: "100%",
                    width: `${Math.min(100, pct)}%`,
                    background: `linear-gradient(90deg, ${color}22, ${color}AA, ${color})`,
                    boxShadow: `0 0 15px ${color}50`,
                    transition: "width 0.2s cubic-bezier(0.1, 0.7, 0.1, 1)",
                    borderRadius: 7
                }} />

                {/* Dynamic Shine on Bar */}
                <div style={{ 
                    position: "absolute", top: 0, left: 0, height: "50%", width: `${pct}%`, 
                    background: "rgba(255,255,255,0.1)", borderRadius: 7, pointerEvents: "none" 
                }} />

                {/* Peak Indicator */}
                <div style={{
                    position: "absolute",
                    left: `${Math.min(99.5, peakPct)}%`,
                    top: 1, bottom: 1, width: 3,
                    backgroundColor: "white",
                    zIndex: 3,
                    boxShadow: "0 0 10px white",
                    transition: "left 0.1s linear"
                }} />
            </div>

            {expanded && (
                <div style={{ 
                    display: "flex", alignItems: "center", gap: 12, padding: "10px", 
                    borderRadius: THEME.radius.md, backgroundColor: "rgba(0,0,0,0.1)" 
                }}>
                    <div style={{ 
                        width: 10, height: 10, borderRadius: "50%", 
                        backgroundColor: showNumbers ? color : THEME.colors.text.muted,
                        boxShadow: showNumbers ? `0 0 10px ${color}` : "none"
                    }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: showNumbers ? (displayLevel > config.warn ? color : THEME.colors.text.secondary) : THEME.colors.text.muted, letterSpacing: 0.5 }}>
                        {!showNumbers ? `ESPERANDO NIVEL > ${config.ideal} dB` : 
                         displayLevel > config.max ? "ESTADO: CRÃTICO - VOLUMEN PELIGROSO" : 
                         displayLevel > config.warn ? "ESTADO: PRECAUCIÃ“N - NIVEL ALTO" : 
                         "ESTADO: Ã“PTIMO - RENDIMIENTO CALIBRADO"}
                    </span>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.4; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
