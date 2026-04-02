import { useState, useEffect } from "react";
import { THEME } from "../data/theme";

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [matches, query]);

    return matches;
};

export const useIsMobile = () => {
    return useMediaQuery(`(max-width: ${THEME.breakpoints.mobile - 1}px)`);
};
