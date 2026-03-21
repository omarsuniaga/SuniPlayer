import { Track } from "../types";
import generatedTracks from "./tracks.json";

interface MaybeDefaultTracks {
    default?: Track[];
}

const trackSource = generatedTracks as Track[] | MaybeDefaultTracks;

export const TRACKS: Track[] = Array.isArray(trackSource)
    ? trackSource
    : (trackSource.default ?? []);

export const VENUES = [
    { id: "lobby", label: "Lobby", color: "#06B6D4" },
    { id: "dinner", label: "Cena", color: "#8B5CF6" },
    { id: "cocktail", label: "Cocktail", color: "#F59E0B" },
    { id: "event", label: "Evento", color: "#EF4444" },
    { id: "cruise", label: "Crucero", color: "#10B981" },
];

export const CURVES = [
    { id: "steady", label: "Estable", desc: "Misma energia" },
    { id: "ascending", label: "Ascendente", desc: "Suave a fuerte" },
    { id: "descending", label: "Descendente", desc: "Fuerte a suave" },
    { id: "wave", label: "Ola", desc: "Sube y baja" },
];

export const MOODS = ["happy", "calm", "melancholic", "energetic"];
