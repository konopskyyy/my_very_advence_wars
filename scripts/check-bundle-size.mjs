import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BUNDLE_DIR = 'server/public/game';
const BUDGET_KIB = 1600;

function jsBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += jsBytes(full);
    else if (entry.name.endsWith('.js')) total += statSync(full).size;
  }
  return total;
}

let bytes;
try {
  bytes = jsBytes(BUNDLE_DIR);
} catch {
  console.error(`Brak ${BUNDLE_DIR}. Uruchom najpierw build klienta.`);
  process.exit(1);
}

const kib = bytes / 1024;
const headroom = BUDGET_KIB - kib;
console.log(`Bundle JS: ${kib.toFixed(1)} KiB / ${BUDGET_KIB} KiB (zapas ${headroom.toFixed(1)} KiB)`);

if (kib > BUDGET_KIB) {
  console.error(`Budżet przekroczony o ${(-headroom).toFixed(1)} KiB.`);
  process.exit(1);
}
