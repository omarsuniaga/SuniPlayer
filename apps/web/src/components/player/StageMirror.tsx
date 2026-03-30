import React, { useEffect, useRef, useState } from "react";
import { THEME } from "../../data/theme";
import { usePlayerStore } from "@suniplayer/core";

export const StageMirror: React.FC = () => {
    const isMirrorOpen = usePlayerStore(s => s.isMirrorOpen);
    const toggleMirror = usePlayerStore(s => s.toggleMirror);
    const mirrorMode = usePlayerStore(s => s.mirrorMode);
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
            
            setPos({
                x: clientX - dragStart.current.x,
                y: clientY - dragStart.current.y
            });
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

    const isFloating = mirrorMode === 'floating';

    return (
        <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onClick={cycleSize}
            style={{
                position: isFloating ? "fixed" : "relative",
                left: isFloating ? pos.x : undefined,
                top: isFloating ? pos.y : undefined,
                width: width,
                height: height,
                borderRadius: 16,
                border: `2px solid ${THEME.colors.brand.cyan}88`,
                boxShadow: isFloating ? `0 8px 32px rgba(0,0,0,0.5), 0 0 15px ${THEME.colors.brand.cyan}33` : "none",
                zIndex: isFloating ? 10000 : 1,
                overflow: "hidden",
                cursor: isFloating ? (dragging ? "grabbing" : "grab") : "pointer",
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
        </div>
    );
};
