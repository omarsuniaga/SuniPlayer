
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as mm from 'music-metadata';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.resolve(__dirname, '../apps/web/public/audio');
const outputFile = path.resolve(__dirname, '../packages/core/src/data/tracks.json');

async function scanAudio() {
    console.log(`Scanning audio in: ${audioDir}`);
    
    if (!fs.existsSync(audioDir)) {
        console.error('Audio directory not found');
        process.exit(1);
    }

    const files = fs.readdirSync(audioDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    
    const tracks = [];

    for (const [index, file] of files.entries()) {
        const filePath = path.join(audioDir, file);
        const nameWithoutExt = file.replace(/\.mp3$/i, '');
        let artist = 'Unknown';
        let title = nameWithoutExt;

        // Try standard "Artist - Title" first
        if (nameWithoutExt.includes(' - ')) {
            const parts = nameWithoutExt.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
        } else if (nameWithoutExt.includes('-')) {
            const parts = nameWithoutExt.split('-');
            artist = parts[0].trim();
            title = parts.slice(1).join('-').trim();
        }

        let duration_ms = 210000; // fallback
        try {
            const metadata = await mm.parseFile(filePath);
            if (metadata.format.duration) {
                duration_ms = Math.round(metadata.format.duration * 1000);
            }
        } catch (err) {
            console.warn(`Could not read metadata for ${file}:`, err.message);
        }

        tracks.push({
            id: `lib-${crypto.createHash('md5').update(file).digest('hex').slice(0, 12)}`,
            title: title,
            artist: artist,
            duration_ms: duration_ms, 
            bpm: 0,
            key: "-",
            energy: 0,
            mood: "calm",
            file_path: file,
            analysis_cached: false
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(tracks, null, 2));
    console.log(`Generated ${tracks.length} tracks in ${outputFile}`);
}

scanAudio();
