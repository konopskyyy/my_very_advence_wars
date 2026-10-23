import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const STORAGE_KEY = 'mvaw:sqlite';

let databasePromise: Promise<Database> | undefined;

export function openDatabase(): Promise<Database> {
  databasePromise ??= createDatabase();

  return databasePromise;
}

export function persistDatabase(db: Database): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, toBase64(db.export()));
}

async function createDatabase(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const stored = readStoredDatabase();

  if (!stored) {
    return new SQL.Database();
  }

  try {
    return new SQL.Database(stored);
  } catch {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }

    return new SQL.Database();
  }
}

function readStoredDatabase(): Uint8Array | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }

  const encoded = localStorage.getItem(STORAGE_KEY);

  if (!encoded) {
    return undefined;
  }

  try {
    return fromBase64(encoded);
  } catch {
    return undefined;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

function fromBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
