import { useState, useEffect } from "react";
import { THEME } from "../data/theme";

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const media = window.matchMedia(query);
        const listener = () => setMatches(media.matches);
        
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
};

export const useIsMobile = () => {
    return useMediaQuery(`(max-width: ${THEME.breakpoints.mobile - 1}px)`);
};
