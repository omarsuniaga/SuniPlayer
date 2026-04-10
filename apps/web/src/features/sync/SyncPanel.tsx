import React, { useState, useEffect } from 'react';
import { usePlayerStore, SessionMember } from '@suniplayer/core';
import { syncEnsemble } from '../../services/network/SyncEnsembleOrchestrator';
import { THEME } from '../../data/theme';

interface SyncPanelProps {
    onClose: () => void;
}

// --- ATOMIC COMPONENTS ---

const StatItem = ({ label, value, color = THEME.colors.text.primary, testId }: { label: string, value: string | number, color?: string, testId?: string }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "9px", fontWeight: 800, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
        <span data-testid={testId} style={{ fontSize: "13px", fontWeight: 900, fontFamily: THEME.fonts.mono, color }}>{value}</span>
    </div>
);

const ActionButton = ({ icon, label, onClick, disabled = false, primary = false }: { icon: string, label: string, onClick: () => void, disabled?: boolean, primary?: boolean }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 8px",
            background: primary ? THEME.gradients.brand : "rgba(255,255,255,0.03)",
            border: primary ? "none" : `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.4 : 1,
            transition: "all 0.2s ease",
            boxShadow: primary ? `0 4px 15px ${THEME.colors.brand.cyan}30` : "none"
        }}
        onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = primary ? "" : "rgba(255,255,255,0.08)")}
        onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = primary ? "" : "rgba(255,255,255,0.03)")}
    >
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ fontSize: "9px", fontWeight: 900, color: primary ? "white" : THEME.colors.text.secondary, textTransform: "uppercase" }}>{label}</span>
    </button>
);

const GuideItem = ({ icon, title, text }: { icon: string, title: string, text: string }) => (
    <div style={{ display: "flex", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: `1px solid ${THEME.colors.border}` }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "11px", fontWeight: 900, color: THEME.colors.brand.cyan, textTransform: "uppercase" }}>{title}</span>
            <span style={{ fontSize: "11px", color: THEME.colors.text.secondary, lineHeight: "1.4" }}>{text}</span>
        </div>
    </div>
);

const MemberPill = ({ member }: { member: SessionMember }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px",
        background: "rgba(255,255,255,0.03)", borderRadius: THEME.radius.full,
        border: `1px solid ${member.role === 'leader' ? THEME.colors.brand.cyan + '40' : THEME.colors.border}`
    }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: member.isConnected ? THEME.colors.status.success : THEME.colors.text.muted }} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: member.role === 'leader' ? THEME.colors.brand.cyan : THEME.colors.text.primary }}>
            {member.name} {member.role === 'leader' && '👑'}
        </span>
    </div>
);

// --- MAIN COMPONENT ---

export const SyncPanel: React.FC<SyncPanelProps> = ({ onClose }) => {
    const { syncStatus, isLeader, clockOffset, sessionId, setSessionId, setIsLeader, pos } = usePlayerStore();
    const [joinId, setJoinId] = useState('');
    const [members, setMembers] = useState<SessionMember[]>([]);
    const [view, setView] = useState<'main' | 'members' | 'guide'>('main');
    const [localUserId] = useState<string>(() => syncEnsemble.sessionManager['userId']);

    useEffect(() => {
        const interval = setInterval(() => {
            setMembers(syncEnsemble.sessionManager.getMembers());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = () => {
        const id = Math.random().toString(36).slice(2, 8).toUpperCase();
        syncEnsemble.sessionManager.createSession(id, "Live Ensemble");
        setSessionId(id);
        setIsLeader(true);
    };

    const handleJoin = () => {
        if (!joinId) return;
        const cleanId = joinId.trim().toUpperCase();
        syncEnsemble.sessionManager.joinSession(cleanId);
        setSessionId(cleanId);
        setIsLeader(false);
    };

    const handleRecalibrate = () => {
        syncEnsemble.orchestrator['clockSync'].forceRecalibrate();
    };

    const handleTuttiPlay = () => {
        syncEnsemble.orchestrator.startGlobalPlayback(pos);
    };

    const handleLeave = () => {
        syncEnsemble.sessionManager.leaveSession();
        setSessionId(null);
    };

    const getStatusColor = () => {
        switch (syncStatus) {
            case 'SYNCED': return THEME.colors.status.success;
            case 'CALIBRATING': return THEME.colors.status.warning;
            case 'DRIFTING': return THEME.colors.brand.pink;
            default: return THEME.colors.text.muted;
        }
    };

    return (
        <div style={{
            width: "320px",
            maxHeight: "85vh",
            backgroundColor: "rgba(10, 14, 20, 0.95)",
            backdropFilter: "blur(40px)",
            borderRadius: THEME.radius.xl,
            border: `1px solid ${THEME.colors.borderLight}`,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 60px rgba(6, 182, 212, 0.1)",
            display: "flex",
            flexDirection: "column",
            color: THEME.colors.text.primary,
            fontFamily: THEME.fonts.main,
            overflow: "hidden",
            animation: "panelAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
            {/* COMPACT HEADER */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${THEME.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: THEME.gradients.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>📡</div>
                    <span style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "1px" }}>SYNC<span style={{ color: THEME.colors.brand.cyan }}>ENSEMBLE</span></span>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
                {!sessionId ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ padding: "12px", background: "rgba(6, 182, 212, 0.05)", borderRadius: "8px", border: `1px solid ${THEME.colors.brand.cyan}20` }}>
                            <p style={{ fontSize: "11px", color: THEME.colors.brand.cyan, fontWeight: 800, margin: "0 0 4px 0", textTransform: "uppercase" }}>¿Cómo funciona?</p>
                            <p style={{ fontSize: "11px", color: THEME.colors.text.secondary, margin: 0, lineHeight: "1.4" }}>
                                Creá una sesión y compartí el código. SuniPlayer sincronizará los relojes de todos para un arranque perfecto.
                            </p>
                        </div>
                        <button onClick={handleCreate} style={{ padding: "16px", background: THEME.gradients.brand, border: "none", borderRadius: THEME.radius.md, color: "white", fontWeight: 900, fontSize: "13px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>
                            CREAR NUEVA SESIÓN
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ flex: 1, height: "1px", background: THEME.colors.border }} />
                            <span style={{ fontSize: "9px", fontWeight: 900, color: THEME.colors.text.muted }}>O UNIRSE</span>
                            <div style={{ flex: 1, height: "1px", background: THEME.colors.border }} />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input type="text" placeholder="CÓDIGO" value={joinId} onChange={(e) => setJoinId(e.target.value.toUpperCase())} style={{ flex: 1, padding: "12px", background: "rgba(0,0,0,0.3)", border: `1px solid ${THEME.colors.border}`, borderRadius: THEME.radius.md, color: "white", fontSize: "14px", fontFamily: THEME.fonts.mono, textAlign: "center", outline: "none" }} />
                            <button onClick={handleJoin} disabled={!joinId} style={{ padding: "0 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${THEME.colors.border}`, borderRadius: THEME.radius.md, color: "white", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>OK</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "16px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: THEME.radius.lg, border: `1px solid ${THEME.colors.border}` }}>
                            <StatItem label="Sesión ID" value={sessionId} color={THEME.colors.brand.cyan} testId="session-id-display" />
                            <StatItem label="Estado Red" value={syncStatus} color={getStatusColor()} testId="sync-status-display" />
                            <StatItem label="Tu Rol" value={isLeader ? "LÍDER" : "SEGUIDOR"} color={isLeader ? THEME.colors.brand.cyan : THEME.colors.brand.violet} />
                            <StatItem 
                                label="Offset" 
                                value={`${clockOffset?.offsetMs.toFixed(1) || 0}ms`} 
                                color={Math.abs(clockOffset?.offsetMs || 0) > 10000 ? THEME.colors.status.error : THEME.colors.text.primary}
                            />
                        </div>

                        {Math.abs(clockOffset?.offsetMs || 0) > 10000 && (
                            <div style={{ padding: "10px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: `1px solid ${THEME.colors.status.error}40` }}>
                                <p style={{ fontSize: "10px", color: THEME.colors.status.error, margin: 0, textAlign: "center", fontWeight: 800 }}>
                                    ⚠️ OFFSET CRÍTICO DETECTADO. <br/> SE RECOMIENDA RECALIBRAR.
                                </p>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: THEME.radius.md }}>
                            <button onClick={() => setView('main')} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "4px", background: view === 'main' ? "rgba(255,255,255,0.05)" : "transparent", color: view === 'main' ? "white" : THEME.colors.text.muted, fontSize: "9px", fontWeight: 800, cursor: "pointer" }}>CONTROLES</button>
                            <button onClick={() => setView('members')} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "4px", background: view === 'members' ? "rgba(255,255,255,0.05)" : "transparent", color: view === 'members' ? "white" : THEME.colors.text.muted, fontSize: "9px", fontWeight: 800, cursor: "pointer" }}>MIEMBROS</button>
                            <button onClick={() => setView('guide')} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "4px", background: view === 'guide' ? "rgba(255,255,255,0.05)" : "transparent", color: view === 'guide' ? "white" : THEME.colors.text.muted, fontSize: "9px", fontWeight: 800, cursor: "pointer" }}>GUÍA</button>
                        </div>

                        {view === 'main' ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <ActionButton icon="🔄" label="Recalibrar" onClick={handleRecalibrate} />
                                <ActionButton icon="⚡" label="Tutti Play" onClick={handleTuttiPlay} primary disabled={!isLeader} />
                                <ActionButton icon="📢" label="Broadcast" onClick={() => {}} disabled={!isLeader} />
                                <ActionButton icon="🚪" label="Salir" onClick={handleLeave} />
                            </div>
                        ) : view === 'members' ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "150px" }}>
                                <div style={{ marginBottom: "4px" }}>
                                    <MemberPill member={{ id: localUserId, name: `Tú (Yo)`, role: isLeader ? 'leader' : 'member', isConnected: true }} />
                                </div>
                                <div style={{ height: "1px", background: THEME.colors.border, marginBottom: "4px" }} />
                                {members.filter(m => m.id !== localUserId).length > 0 ? members.filter(m => m.id !== localUserId).map(m => (
                                    <MemberPill key={m.id} member={m} />
                                )) : (
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.colors.text.muted, fontSize: "11px", fontStyle: "italic" }}>
                                        Esperando músicos...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "150px" }}>
                                <GuideItem icon="👑" title="Líder (Master)" text="Solo vos controlás el transporte global. Al dar Play, todos arrancan juntos." />
                                <GuideItem icon="📡" title="Offset de Reloj" text="Muestra la diferencia temporal con el líder. Se corrige automáticamente." />
                                <GuideItem icon="💾" title="Persistencia" text="Tu identidad y sesión se guardan. Si refrescás, te reconectamos al instante." />
                                <GuideItem icon="⚡" title="Tutti Play" text="Forzá el arranque sincronizado de todos los dispositivos al instante." />
                                <GuideItem icon="📢" title="Broadcast" text="Envía alertas visuales o notas compartidas a todo el ensamble en tiempo real." />
                                <GuideItem icon="🔄" title="Recalibrar" text="Si notás desfase, usá esto para re-ajustar los relojes en tiempo real." />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ padding: "12px", background: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                <span style={{ fontSize: "8px", fontWeight: 900, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: "2px" }}>Atomic Performance Engine v1.0</span>
            </div>

            <style>{`
                @keyframes panelAppear {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};
