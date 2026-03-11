import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { THEME } from "../../data/theme.ts";
import { getAsset } from "../../services/assetStorage.ts";
import { useProjectStore } from "../../store/useProjectStore.ts";
import { fmt } from "../../services/uiUtils.ts";

interface SheetMusicViewerProps {
    items: { id: string; type: "pdf" | "image"; name: string }[];
    onClose: () => void;
}

export const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({ items, onClose }) => {
    // Local State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
    
    // Player State from Store
    const setPos = useProjectStore(s => s.setPos);
    const playing = useProjectStore(s => s.playing);
    const setPlaying = useProjectStore(s => s.setPlaying);
    const pos = useProjectStore(s => s.pos);
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    
    const ct = pQueue[ci];
    const remainingMs = ct ? (ct.duration_ms || 1) - pos : 0;

    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const currentItem = items[currentIndex];

    // Calculate zoom needed to fit width
    const fitToWidth = () => {
        if (!containerRef.current || !imgDimensions.w) return;
        const padding = 40; // Total horizontal padding (20 + 20)
        const availableWidth = containerRef.current.clientWidth - padding;
        const fitZoom = (availableWidth / imgDimensions.w) * 100;
        
        setZoom(Math.round(fitZoom));
        setRotation(0);
        
        // Scroll to top
        setTimeout(() => {
            if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }, 50);
    };

    const centerImage = () => {
        if (!containerRef.current || !imgRef.current) return;
        setZoom(100);
        setRotation(0);
        
        setTimeout(() => {
            if (containerRef.current) {
                const scrollHeight = containerRef.current.scrollHeight;
                const clientHeight = containerRef.current.clientHeight;
                const scrollWidth = containerRef.current.scrollWidth;
                const clientWidth = containerRef.current.clientWidth;
                
                containerRef.current.scrollTo({
                    top: (scrollHeight - clientHeight) / 2,
                    left: (scrollWidth - clientWidth) / 2,
                    behavior: "smooth"
                });
            }
        }, 50);
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setImgDimensions({ w: naturalWidth, h: naturalHeight });
        
        // Auto-fit on first load
        const padding = 40;
        const availableWidth = containerRef.current?.clientWidth || window.innerWidth;
        const fitZoom = ((availableWidth - padding) / naturalWidth) * 100;
        setZoom(Math.round(fitZoom));
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        setImgDimensions({ w: 0, h: 0 });
    }, [currentIndex]);

    useEffect(() => {
        if (!currentItem) return;
        
        let active = true;
        getAsset(currentItem.id).then(blob => {
            if (active && blob) {
                const objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            }
        });

        return () => {
            active = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [currentIndex, currentItem?.id]);

    // Input handlers (Combined Mouse & Touch)
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (currentItem.type === "pdf" || !containerRef.current) return;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        dragRef.current = {
            isDragging: true,
            startX: clientX,
            startY: clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop
        };
        if (!('touches' in e)) {
            containerRef.current.style.cursor = "grabbing";
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragRef.current.isDragging || !containerRef.current) return;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const walkX = clientX - dragRef.current.startX;
        const walkY = clientY - dragRef.current.startY;
        
        containerRef.current.scrollLeft = dragRef.current.scrollLeft - walkX;
        containerRef.current.scrollTop = dragRef.current.scrollTop - walkY;
        
        dragRef.current.startX = clientX;
        dragRef.current.startY = clientY;
    };

    const handleEnd = () => {
        dragRef.current.isDragging = false;
        if (containerRef.current) containerRef.current.style.cursor = "grab";
    };

    const content = (
        <div style={{
            position: "fixed", inset: 0, zIndex: 99999,
            display: "flex", flexDirection: "column",
            backgroundColor: "#000000",
            animation: "fadeIn 0.2s ease-out"
        }}>
            {/* Toolbar Top - High Visibility & Responsive */}
            <header style={{
                padding: "8px 12px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: `1px solid rgba(255,255,255,0.1)`,
                backgroundColor: "#0d0d12",
                zIndex: 10,
                boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                minHeight: 56
            }}>
                {/* Left: Info (Hidden on very small mobile to save space) */}
                <div className="viewer-info" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flexShrink: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <h3 className="viewer-title" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentItem?.name || "Partitura"}</h3>
                        <span style={{ fontSize: 10, color: THEME.colors.text.muted }}>{currentIndex + 1} / {items.length}</span>
                    </div>
                </div>
                
                {/* Right: Controls (Prioritized) */}
                <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                    {/* Zoom Tools */}
                    {currentItem?.type === "image" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 4, paddingRight: 4, borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                            <button onClick={() => setZoom(z => Math.max(10, z - 10))} style={toolBtnStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
                            <span style={{ fontSize: 11, width: 35, textAlign: "center", color: "white", fontWeight: 700 }}>{zoom}%</span>
                            <button onClick={() => setZoom(z => Math.min(800, z + 10))} style={toolBtnStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
                            <button onClick={fitToWidth} style={{ ...toolBtnStyle, backgroundColor: `${THEME.colors.brand.cyan}20`, color: THEME.colors.brand.cyan, padding: "6px 8px", borderRadius: 4, marginLeft: 2 }} title="Ajustar al Ancho">
                                <span style={{ fontSize: 9, fontWeight: 900, whiteSpace: "nowrap" }}>AJUSTAR</span>
                            </button>
                            <button onClick={centerImage} style={{ ...toolBtnStyle, backgroundColor: `rgba(255,255,255,0.1)`, color: "white", padding: "6px 8px", borderRadius: 4, marginLeft: 2 }} title="Centrar">
                                <span style={{ fontSize: 9, fontWeight: 900, whiteSpace: "nowrap" }}>CENTRAR</span>
                            </button>
                        </div>
                    )}

                    {/* Pagination Arrow Controls */}
                    <div style={{ display: "flex", gap: 0 }}>
                        <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)} style={{ ...toolBtnStyle, opacity: currentIndex === 0 ? 0.2 : 1 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                        <button disabled={currentIndex === items.length - 1} onClick={() => setCurrentIndex(i => i + 1)} style={{ ...toolBtnStyle, opacity: currentIndex === items.length - 1 ? 0.2 : 1 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
                    </div>

                    <button onClick={onClose} style={{ marginLeft: 4, width: 38, height: 38, borderRadius: "50%", border: "none", backgroundColor: "#ff3b30", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(255,59,48,0.3)" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main 
                ref={containerRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                style={{ 
                    flex: 1, position: "relative", overflow: "auto", 
                    display: "flex", flexDirection: "column",
                    backgroundColor: "#000",
                    touchAction: currentItem?.type === "image" ? "none" : "auto",
                    paddingBottom: 20
                }}
            >
                {loading && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 5 }}>
                        <div style={{ width: 40, height: 40, border: `3px solid ${THEME.colors.brand.violet}`, borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                )}
                
                {url ? (
                    currentItem.type === "pdf" ? (
                        <iframe 
                            src={`${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`} 
                            style={{ width: "100%", height: "100%", border: "none" }}
                            title="Sheet Music PDF"
                        />
                    ) : (
                        <div style={{ 
                            padding: "20px", display: "flex", justifyContent: "center", minHeight: "100%",
                            alignItems: "flex-start" // Ensures we start at the top
                        }}>
                            <img 
                                ref={imgRef}
                                src={url} 
                                onLoad={handleImageLoad}
                                alt="Sheet Music" 
                                draggable={false}
                                style={{ 
                                    width: imgDimensions.w ? `${(imgDimensions.w * zoom) / 100}px` : "auto", 
                                    maxWidth: "none",
                                    height: "auto",
                                    borderRadius: 4, 
                                    boxShadow: zoom > 30 ? "0 20px 80px rgba(0,0,0,0.8)" : "none",
                                    transform: `rotate(${rotation}deg)`,
                                    transition: "transform 0.3s ease",
                                    pointerEvents: "none",
                                    marginTop: 10
                                }} 
                            />
                        </div>
                    )
                ) : !loading && (
                    <div style={{ color: "white", textAlign: "center", marginTop: 100 }}>Error al cargar archivo</div>
                )}
            </main>

            {/* Footer Bar */}
            <footer style={{
                height: 80, backgroundColor: "#050508", borderTop: `1px solid rgba(0,255,255,0.2)`,
                display: "grid", gridTemplateColumns: "80px 1fr 60px", alignItems: "center", padding: "0 20px", gap: 20
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: THEME.colors.brand.cyan, fontWeight: 900, textTransform: "uppercase" }}>Time</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "white", fontFamily: THEME.fonts.mono }}>-{fmt(remainingMs)}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                   <div style={{ fontSize: 13, fontWeight: 800, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6 }}>{ct?.title}</div>
                   <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(pos / (ct?.duration_ms || 1)) * 100}%`, backgroundColor: THEME.colors.brand.cyan, boxShadow: `0 0 10px ${THEME.colors.brand.cyan}`, transition: "width 0.1s linear" }} />
                   </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                        onClick={() => { setPlaying(false); setPos(0); }}
                        style={{
                            width: 38, height: 38, borderRadius: "50%", border: `1px solid rgba(255,255,255,0.1)`,
                            backgroundColor: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                        title="Detener"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    </button>
                    <button
                        onClick={() => setPlaying(!playing)}
                        style={{
                            width: 48, height: 48, borderRadius: "50%", border: "none",
                            backgroundColor: playing ? "rgba(255,255,255,0.1)" : THEME.colors.brand.cyan,
                            color: playing ? "white" : "black", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                    >
                        {playing ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                        )}
                    </button>
                </div>
            </footer>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );

    return createPortal(content, document.body);
};

const toolBtnStyle: React.CSSProperties = {
    padding: "8px", background: "none", border: "none", color: "white",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px"
};
