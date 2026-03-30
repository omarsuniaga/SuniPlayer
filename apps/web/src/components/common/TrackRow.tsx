import React from "react";
import { Track } from "@suniplayer/core";
import { fmt, fmtFull, mc, ec, getEffectiveDuration } from "@suniplayer/core";
import { THEME } from "../../data/theme.ts";

interface TrackRowProps {
    track: Track;
    idx: number;
    showN?: boolean;
    onAdd?: (track: Track) => void;
    onRm?: (idx: number) => void;
    active?: boolean;
    onClick?: () => void;
    onTrim?: (track: Track) => void;
    onEdit?: (track: Track) => void;
    small?: boolean;
}

const MiniWaveform: React.FC<{ waveform?: number[], color: string }> = ({ waveform, color }) => {
    if (!waveform || waveform.length === 0) return (
        <div style={{ width: 44, height: 16, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <div style={{ width: "60%", height: 1, backgroundColor: "rgba(255,255,255,0.1)" }}></div>
        </div>
    );
    
    // Show only 20 bars for the mini view
    const step = Math.max(1, Math.floor(waveform.length / 20));
    const bars = waveform.filter((_, i) => i % step === 0).slice(0, 20);

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 1, height: 12, width: 44, flexShrink: 0 }}>
            {bars.map((h, i) => (
                <div key={i} style={{
                    flex: 1,
                    height: `${Math.max(20, h * 100)}%`,
                    backgroundColor: color,
                    opacity: 0.3 + (h * 0.7),
                    borderRadius: 1
                }} />
            ))}
        </div>
    );
};

export const TrackRow: React.FC<TrackRowProps> = ({
    track,
    idx,
    showN,
    onAdd,
    onRm,
    active,
    onClick,
    onTrim,
    onEdit,
    small,
}) => {
    const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
    const [touchEndX, setTouchEndX] = React.useState<number | null>(null);
    const [swipeOffset, setSwipeOffset] = React.useState(0);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchEndX(null);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const currentX = e.targetTouches[0].clientX;
        setTouchEndX(currentX);
        if (touchStartX !== null) {
            const offset = currentX - touchStartX;
            // Dampen the offset to show visual feedback without moving too much
            setSwipeOffset(offset / 2);
        }
    };

    const onTouchEnd = () => {
        if (!touchStartX || !touchEndX) {
            setSwipeOffset(0);
            return;
        }
        
        const distance = touchStartX - touchEndX;
        const isLeftSwipe = distance > 70;
        const isRightSwipe = distance < -70;

        if (isRightSwipe && onAdd) {
            onAdd(track);
        } else if (isLeftSwipe && onEdit) {
            onEdit(track);
        }
        
        setSwipeOffset(0);
        setTouchStartX(null);
        setTouchEndX(null);
    };
    return (
        <div
            onClick={onClick}
            className={`track-row ${active ? 'active' : ''}`}
            style={{
                display: "flex",
                alignItems: "center",
                gap: small ? 8 : 12,
                padding: small ? "8px 10px" : "12px 14px",
                borderRadius: THEME.radius.md,
                cursor: onClick ? "pointer" : "default",
                backgroundColor: active ? `${THEME.colors.brand.cyan}15` : "transparent",
                borderLeft: active ? `3px solid ${THEME.colors.brand.cyan}` : "3px solid transparent",
                transition: swipeOffset === 0 ? "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                transform: `translateX(${swipeOffset}px)`,
                fontFamily: THEME.fonts.main,
                position: "relative",
                overflow: "hidden",
                minWidth: 0,
                touchAction: "pan-y", // Allow vertical scrolling, intercept horizontal
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = e.currentTarget as HTMLDivElement;
                if (!active) target.style.backgroundColor = THEME.colors.surfaceHover;
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.backgroundColor = active ? `${THEME.colors.brand.cyan}15` : "transparent";
            }}
        >
            <style>{`
                .track-row { min-width: 0; }
                .track-info { flex: 1; min-width: 0; }
                .track-meta { display: flex; align-items: center; gap: 8; flex-shrink: 0; }
                .track-actions { display: flex; gap: 4; margin-left: 8; flex-shrink: 0; }
                
                @media (max-width: 540px) {
                    .meta-energy { display: none !important; }
                    .meta-key { font-size: 9px !important; padding: 1px 4px !important; }
                    .track-meta { gap: 6px; }
                    .track-actions { gap: 2px; margin-left: 4px; }
                    .action-btn { width: 24px !important; height: 24px !important; }
                    .action-btn svg { width: 12px !important; height: 12px !important; }
                    .mini-waveform { display: none !important; }
                }
            `}</style>
            
            {showN && (
                <span
                    style={{
                        fontSize: 11,
                        color: active ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                        fontFamily: THEME.fonts.mono,
                        width: 20,
                        textAlign: "right",
                        fontWeight: active ? 700 : 400,
                        flexShrink: 0,
                    }}
                >
                    {(idx + 1).toString().padStart(2, '0')}
                </span>
            )}

            <div className="track-info">
                <div
                    style={{
                        fontSize: small ? 13 : 14,
                        fontWeight: active ? 700 : 500,
                        color: active ? "white" : THEME.colors.text.primary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {track.title}
                </div>
                <div style={{ fontSize: 11, color: THEME.colors.text.muted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {track.artist}
                </div>
                {swipeOffset !== 0 && (
                    <div style={{ 
                        position: "absolute", 
                        inset: 0, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: swipeOffset > 0 ? "flex-start" : "flex-end",
                        padding: "0 20px",
                        background: swipeOffset > 0 ? THEME.colors.brand.cyan + "40" : THEME.colors.brand.violet + "40",
                        pointerEvents: "none",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 900,
                        zIndex: 10
                    }}>
                        {swipeOffset > 0 ? "ADD TO QUEUE â†’" : "â† VIEW PROFILE"}
                    </div>
                )}
                {(track.playCount || 0) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ 
                            fontSize: 9, padding: "1px 5px", borderRadius: 3, 
                            backgroundColor: "rgba(255,255,255,0.06)", 
                            color: active ? "white" : THEME.colors.text.muted, 
                            fontWeight: 800,
                            letterSpacing: "0.02em"
                        }}>
                            {track.playCount} {track.playCount === 1 ? 'PLAY' : 'PLAYS'}
                        </span>
                        <span style={{ fontSize: 9, color: active ? "white" : THEME.colors.text.muted, opacity: active ? 0.9 : 0.6, fontWeight: 600 }}>
                            {fmtFull(track.totalPlayTimeMs || 0)} tocados
                        </span>
                    </div>
                )}
            </div>

            <div className="track-meta">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                    <span
                        className="meta-key"
                        style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: THEME.radius.sm,
                            backgroundColor: mc(track.mood) + "12",
                            color: mc(track.mood),
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                        }}
                    >
                        {track.targetKey || track.key}
                    </span>
                    {track.transposeSemitones ? (
                        <span style={{ fontSize: 9, color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono }}>
                            {track.transposeSemitones > 0 ? `+${track.transposeSemitones}` : track.transposeSemitones} st
                        </span>
                    ) : null}
                </div>

                <div
                    className="meta-energy"
                    style={{
                        width: 32,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        overflow: "hidden",
                        flexShrink: 0,
                    }}
                    title={`Energy: ${Math.round(track.energy * 100)}%`}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${track.energy * 100}%`,
                            backgroundColor: ec(track.energy),
                            borderRadius: 2,
                        }}
                    />
                </div>

                <div className="mini-waveform">
                    <MiniWaveform 
                        waveform={track.waveform} 
                        color={active ? "white" : THEME.colors.brand.cyan} 
                    />
                </div>

                <span
                    style={{
                        fontSize: 10,
                        color: THEME.colors.text.muted,
                        fontFamily: THEME.fonts.mono,
                        minWidth: 32,
                        textAlign: "right",
                        flexShrink: 0,
                    }}
                >
                    {fmt(getEffectiveDuration(track))}
                </span>
            </div>

            <div className="track-actions">
                {onTrim && (
                    <button
                        className="action-btn"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onTrim(track);
                        }}
                        style={{
                            background: THEME.colors.surfaceHover,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.sm,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: THEME.colors.text.muted,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = THEME.colors.brand.cyan;
                            e.currentTarget.style.borderColor = THEME.colors.brand.cyan + "40";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = THEME.colors.text.muted;
                            e.currentTarget.style.borderColor = THEME.colors.border;
                        }}
                        title="Recortar inicio/fin"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                            <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                            <line x1="8.12" y1="8.12" x2="12" y2="12" />
                        </svg>
                    </button>
                )}
                {onEdit && (
                    <button
                        className="action-btn"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onEdit(track);
                        }}
                        style={{
                            background: THEME.colors.surfaceHover,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.sm,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: THEME.colors.text.muted,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = THEME.colors.brand.violet;
                            e.currentTarget.style.borderColor = THEME.colors.brand.violet + "40";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = THEME.colors.text.muted;
                            e.currentTarget.style.borderColor = THEME.colors.border;
                        }}
                        title="Ver perfil y editar track"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>
                )}
                {onAdd && (
                        <button
                            className="action-btn"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                onAdd(track);
                            }}
                            title="AÃ±adir al setlist"
                            style={{
                            background: THEME.colors.surfaceHover,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.sm,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: THEME.colors.brand.cyan,
                            fontSize: 16,
                            fontWeight: 600,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = THEME.colors.brand.cyan;
                            e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover;
                            e.currentTarget.style.color = THEME.colors.brand.cyan;
                        }}
                    >
                        +
                    </button>
                )}
                {onRm && (
                    <button
                        className="action-btn"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onRm(idx);
                        }}
                        style={{
                            background: "rgba(239,68,68,0.05)",
                            border: `1px solid ${THEME.colors.status.error}30`,
                            borderRadius: THEME.radius.sm,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: THEME.colors.status.error,
                            fontSize: 14,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = THEME.colors.status.error;
                            e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.05)";
                            e.currentTarget.style.color = THEME.colors.status.error;
                        }}
                    >
                        Ã—
                    </button>
                )}
            </div>
        </div>
    );
};
