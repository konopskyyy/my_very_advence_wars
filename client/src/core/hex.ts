export interface Hex {
  q: number;
  r: number;
}

// Współrzędne "doubled-width": q = 2·kolumna + (r & 1), więc parzyste wiersze mają
// q = 0, 2, 4…, a nieparzyste 1, 3, 5… — parzystość q mówi wprost, w którym wierszu
// leży heks. Heks istnieje tylko dla q ≡ r (mod 2).
export const HEX_DIRECTIONS: readonly Hex[] = [
  { q: 2, r: 0 },
  { q: -2, r: 0 },
  { q: 1, r: -1 },
  { q: -1, r: -1 },
  { q: 1, r: 1 },
  { q: -1, r: 1 },
];

export const hexKey = ({ q, r }: Hex): string => `${q},${r}`;

export const hexEquals = (a: Hex, b: Hex): boolean => a.q === b.q && a.r === b.r;

export const isHexCoordinateValid = ({ q, r }: Hex): boolean => Math.abs((q - r) % 2) === 0;

export const hexNeighbors = ({ q, r }: Hex): Hex[] =>
  HEX_DIRECTIONS.map((d) => ({ q: q + d.q, r: r + d.r }));

export function hexDistance(a: Hex, b: Hex): number {
  const dq = Math.abs(a.q - b.q);
  const dr = Math.abs(a.r - b.r);

  if (dq <= dr) return dr;

  // W tym samym wierszu q zmienia się o 2, po skosie o 1 na wiersz — nadwyżkę
  // poziomą ponad różnicę wierszy dzielimy przez 2.
  return dr + (dq - dr) / 2;
}

export function hexesInRange(center: Hex, radius: number): Hex[] {
  const out: Hex[] = [];

  // Tylko kandydaci o parzystości q ≡ r (mod 2) są prawdziwymi heksami.
  for (let dr = -radius; dr <= radius; dr++) {
    const start = ((center.q + dr) % 2 + 2) % 2;
    for (let dq = start - 2 * radius; dq <= 2 * radius; dq += 2) {
      const candidate = { q: center.q + dq, r: center.r + dr };
      if (hexDistance(center, candidate) <= radius) out.push(candidate);
    }
  }
  return out;
}

export function hexRing(center: Hex, radius: number): Hex[] {
  if (radius === 0) return [{ ...center }];

  const inner = new Set(hexesInRange(center, radius - 1).map(hexKey));
  return hexesInRange(center, radius).filter((hex) => !inner.has(hexKey(hex)));
}
