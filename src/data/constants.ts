import { Track } from "../types";

export const TRACKS: Track[] = [
    { id: "1", title: "Fly Me To The Moon", artist: "Sinatra", duration_ms: 190000, bpm: 120, key: "C", energy: .7, mood: "happy", file_path: "Sinatra - Fly Me To The Moon.mp3", analysis_cached: true },
    { id: "2", title: "Besame Mucho", artist: "Bocelli", duration_ms: 220000, bpm: 95, key: "Dm", energy: .5, mood: "melancholic", file_path: "Bocelli - Besame Mucho.mp3", analysis_cached: true },
    { id: "3", title: "Perfect", artist: "Ed Sheeran", duration_ms: 263000, bpm: 63, key: "Ab", energy: .6, mood: "calm", file_path: "Ed Sheeran - Perfect.mp3", analysis_cached: true },
    { id: "4", title: "La Vie en Rose", artist: "Piaf", duration_ms: 200000, bpm: 78, key: "G", energy: .4, mood: "calm", file_path: "Piaf - La Vie en Rose.mp3", analysis_cached: true },
    { id: "5", title: "Autumn Leaves", artist: "Jazz Std", duration_ms: 255000, bpm: 110, key: "Gm", energy: .5, mood: "melancholic", file_path: "Jazz Std - Autumn Leaves.mp3", analysis_cached: true },
    { id: "6", title: "Can't Help Falling in Love", artist: "Elvis", duration_ms: 180000, bpm: 72, key: "C", energy: .4, mood: "calm", file_path: "Elvis - Cant Help Falling in Love.mp3", analysis_cached: true },
    { id: "7", title: "All of Me", artist: "John Legend", duration_ms: 269000, bpm: 63, key: "Ab", energy: .5, mood: "calm", file_path: "John Legend - All of Me.mp3", analysis_cached: true },
    { id: "8", title: "Shape of You", artist: "Ed Sheeran", duration_ms: 234000, bpm: 96, key: "C#m", energy: .8, mood: "energetic", file_path: "Ed Sheeran - Shape of You.mp3", analysis_cached: true },
    { id: "9", title: "Despacito", artist: "Luis Fonsi", duration_ms: 228000, bpm: 89, key: "Bm", energy: .85, mood: "energetic", file_path: "Luis Fonsi - Despacito.mp3", analysis_cached: true },
    { id: "10", title: "A Thousand Years", artist: "C. Perri", duration_ms: 285000, bpm: 67, key: "Bb", energy: .35, mood: "calm", file_path: "C. Perri - A Thousand Years.mp3", analysis_cached: true },
    { id: "11", title: "My Way", artist: "Sinatra", duration_ms: 277000, bpm: 76, key: "D", energy: .6, mood: "happy", file_path: "Sinatra - My Way.mp3", analysis_cached: true },
    { id: "12", title: "Thinking Out Loud", artist: "Ed Sheeran", duration_ms: 281000, bpm: 79, key: "D", energy: .55, mood: "calm", file_path: "Ed Sheeran - Thinking Out Loud.mp3", analysis_cached: true },
    { id: "13", title: "L-O-V-E", artist: "Nat King Cole", duration_ms: 155000, bpm: 130, key: "G", energy: .75, mood: "happy", file_path: "Nat King Cole - L-O-V-E.mp3", analysis_cached: true },
    { id: "14", title: "Libertango", artist: "Piazzolla", duration_ms: 210000, bpm: 132, key: "Am", energy: .9, mood: "energetic", file_path: "Piazzolla - Libertango.mp3", analysis_cached: true },
    { id: "15", title: "Cinema Paradiso", artist: "Morricone", duration_ms: 240000, bpm: 60, key: "F", energy: .3, mood: "melancholic", file_path: "Morricone - Cinema Paradiso.mp3", analysis_cached: true },
    { id: "16", title: "Havana", artist: "C. Cabello", duration_ms: 217000, bpm: 105, key: "Bm", energy: .75, mood: "energetic", file_path: "C. Cabello - Havana.mp3", analysis_cached: true },
    { id: "17", title: "Con Te Partiro", artist: "Bocelli", duration_ms: 250000, bpm: 68, key: "Bb", energy: .55, mood: "melancholic", file_path: "Bocelli - Con Te Partiro.mp3", analysis_cached: true },
    { id: "18", title: "Wonderful World", artist: "Armstrong", duration_ms: 140000, bpm: 72, key: "F", energy: .35, mood: "calm", file_path: "Armstrong - Wonderful World.mp3", analysis_cached: true },
];

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
