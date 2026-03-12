
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.resolve(__dirname, '../public/audio');

function sanitizeFilename(name) {
    return name
        .replace(/,/g, '') // Remove commas
        .replace(/\[/g, '(') // Replace brackets
        .replace(/\]/g, ')')
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
}

async function sanitizeAll() {
    console.log(`Sanitizing audio filenames in: ${audioDir}`);
    
    if (!fs.existsSync(audioDir)) {
        console.error('Audio directory not found');
        return;
    }

    const files = fs.readdirSync(audioDir);
    
    for (const file of files) {
        if (!file.toLowerCase().endsWith('.mp3')) continue;
        
        const oldPath = path.join(audioDir, file);
        const newName = sanitizeFilename(file);
        const newPath = path.join(audioDir, newName);
        
        if (oldPath !== newPath) {
            console.log(`Renaming: "${file}" -> "${newName}"`);
            try {
                fs.renameSync(oldPath, newPath);
            } catch (err) {
                console.error(`Failed to rename ${file}:`, err.message);
            }
        }
    }
    
    console.log('Sanitization complete.');
}

sanitizeAll();
