import React from "react";
import { THEME } from "../../data/theme";

export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({ 
    size = 20, 
    color = THEME.colors.brand.cyan 
}) => {
    return (
        <div className="spinner" style={{ 
            width: size, 
            height: size, 
            border: `2px solid ${color}30`,
            borderTop: `2px solid ${color}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
        }}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
