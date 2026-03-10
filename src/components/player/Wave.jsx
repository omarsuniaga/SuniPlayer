import React from "react";

export const Wave = ({ data, progress, color }) => {
    return (
        <div style={{ display: "flex", alignItems: "center", height: 52, gap: 1, padding: "0 2px" }}>
            {data.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <div
                        style={{
                            width: "100%",
                            borderRadius: 1,
                            height: `${v * 100}%`,
                            minHeight: 2,
                            backgroundColor: i / data.length < progress ? color : "rgba(255,255,255,0.1)",
                            transition: "background-color .15s",
                        }}
                    />
                </div>
            ))}
        </div>
    );
};
