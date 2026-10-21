import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Pod file:// (Electron) absolutne "/assets/…" wskazują na korzeń dysku, więc po
// buildzie zamieniamy je na względne.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'dist', 'index.html');

const html = await readFile(indexPath, 'utf8');
const relative = html.replace(/(src|href)="\//g, '$1="');

await writeFile(indexPath, relative);
console.log('dist/index.html: ścieżki assetów zamienione na względne (dla Electrona).');
