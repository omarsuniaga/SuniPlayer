import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "suniplayer-assets";
const STORE_NAME = "sheet-music";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME);
            },
        });
    }
    return dbPromise;
}

export async function saveAsset(id: string, file: File | Blob): Promise<string> {
    const db = await getDB();
    await db.put(STORE_NAME, file, id);
    return id;
}

export async function getAsset(id: string): Promise<Blob | null> {
    const db = await getDB();
    return await db.get(STORE_NAME, id);
}

export async function deleteAsset(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
}
