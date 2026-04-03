import React, { useEffect, useRef, useState } from "react";
import { THEME } from "../../data/theme";
import { usePlayerStore } from "@suniplayer/core";

export const StageMirror: React.FC = () => {
    const isMirrorOpen = usePlayerStore(s => s.isMirrorOpen);
    const toggleMirror = usePlayerStore(s => s.toggleMirror);
    const mirrorMode = usePlayerStore(s => s.mirrorMode);
    const setMirrorMode = usePlayerStore(s => s.setMirrorMode);
    const mirrorSize = usePlayerStore(s => s.mirrorSize);
    const setMirrorSize = usePlayerStore(s => s.setMirrorSize);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Map sm, md, lg to widths for 9:16 aspect ratio
    const sizeMap = {
        sm: 140,
        md: 220,
        lg: 320
    };
    
    const width = sizeMap[mirrorSize];
    const height = (width * 16) / 9; // 9:16 Vertical Aspect Ratio

    const [pos, setPos] = useState({ x: window.innerWidth - width - 40, y: 100 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        let activeStream: MediaStream | null = null;
        
        async function startCamera() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 720 },
                        height: { ideal: 1280 },
                        facingMode: "user"
                    } 
                });
                activeStream = s;
                setStream(s);
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                toggleMirror(); // Auto-close if no permission or error
            }
        }

        if (isMirrorOpen) {
            startCamera();
        }

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isMirrorOpen, toggleMirror]);

    // Re-attach stream if video element re-renders
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (mirrorMode === 'docked') return;
        
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        
        setDragging(true);
        dragStart.current = {
            x: clientX - pos.x,
            y: clientY - pos.y
        };
    };

    useEffect(() => {
        if (mirrorMode === 'docked') return;

        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            if (!dragging) return;
            
            const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
            
            let newX = clientX - dragStart.current.x;
            let newY = clientY - dragStart.current.y;

            // ── BOUNDARY CONSTRAINTS (Nivel 4) ──
            // Prevent dragging off-screen
            const padding = 10;
            newX = Math.max(padding, Math.min(newX, window.innerWidth - width - padding));
            newY = Math.max(padding, Math.min(newY, window.innerHeight - height - padding));
            
            setPos({ x: newX, y: newY });
        };

        const handleMouseUp = () => setDragging(false);

        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleMouseMove);
            window.addEventListener("touchend", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleMouseMove);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [dragging, mirrorMode]);

    const cycleSize = (e: React.MouseEvent) => {
        e.stopPropagation();
        const sizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg'];
        const currentIndex = sizes.indexOf(mirrorSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        setMirrorSize(sizes[nextIndex]);
    };

    const toggleMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMirrorMode(mirrorMode === 'docked' ? 'floating' : 'docked');
    };

    const isFloating = mirrorMode === 'floating';

    return (
        <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            style={{
                position: isFloating ? "fixed" : "relative",
                left: isFloating ? pos.x : undefined,
                top: isFloating ? pos.y : undefined,
                width: width,
                height: height,
                borderRadius: 16,
                border: `2px solid ${THEME.colors.brand.cyan}88`,
                boxShadow: isFloating ? `0 12px 40px rgba(0,0,0,0.6), 0 0 20px ${THEME.colors.brand.cyan}44` : "none",
                zIndex: isFloating ? 10000 : 1,
                overflow: "hidden",
                cursor: isFloating ? (dragging ? "grabbing" : "grab") : "default",
                transition: "width 0.3s ease, height 0.3s ease, border-color 0.3s ease",
                backgroundColor: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                touchAction: "none",
                margin: !isFloating ? "10px auto" : undefined
            }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)", // Mirror effect
                    pointerEvents: "none"
                }}
            />
            
            {/* Glossy Overlay */}
            <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%)",
                pointerEvents: "none"
            }} />

            {/* ── Controls Overlay ── */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {/* Size Cycle Trigger (Hidden area) */}
                <div 
                    onClick={cycleSize}
                    style={{ position: "absolute", inset: 0, cursor: isFloating ? "inherit" : "pointer", pointerEvents: "auto" }} 
                />

                {/* Float/Dock Toggle (Top Left) */}
                <button
                    onClick={toggleMode}
                    title={isFloating ? "Anclar a la vista" : "Hacer flotante"}
                    style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: THEME.colors.brand.cyan,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 10,
                        pointerEvents: "auto",
                        backdropFilter: "blur(4px)",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(6, 182, 212, 0.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.5)"}
                >
                    {isFloating ? 
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6M3 10h18M3 14h18"/></svg> :
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    }
                </button>

                {/* Close Button (Discreet but visible) */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleMirror(); }}
                    style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 10,
                        pointerEvents: "auto",
                        backdropFilter: "blur(4px)",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = THEME.colors.status.error}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.5)"}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Mode Indicator (Optional, subtle) */}
                <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 9, fontWeight: 900, color: "white", opacity: 0.4, textTransform: "uppercase", letterSpacing: 1 }}>
                    {mirrorSize} • {mirrorMode}
                </div>
            </div>
        </div>
    );
};
