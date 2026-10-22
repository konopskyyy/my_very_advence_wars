export interface HexCoord {
  readonly col: number;
  readonly row: number;
}

export interface AxialHex {
  readonly q: number;
  readonly r: number;
}

const SQRT3 = Math.sqrt(3);

export function toAxial(coord: HexCoord): AxialHex {
  return { q: coord.col - ((coord.row - (coord.row & 1)) >> 1), r: coord.row };
}

export function fromAxial(hex: AxialHex): HexCoord {
  return { col: hex.q + ((hex.r - (hex.r & 1)) >> 1), row: hex.r };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const from = toAxial(a);
  const to = toAxial(b);

  return (
    (Math.abs(from.q - to.q) + Math.abs(from.q + from.r - to.q - to.r) + Math.abs(from.r - to.r)) / 2
  );
}

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  const axial = toAxial(coord);
  const offsets: readonly AxialHex[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  return offsets.map((offset) => fromAxial({ q: axial.q + offset.q, r: axial.r + offset.r }));
}

export function hexToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  const axial = toAxial(coord);

  return {
    x: size * (SQRT3 * axial.q + (SQRT3 / 2) * axial.r),
    y: size * 1.5 * axial.r,
  };
}

export function pixelToHex(x: number, y: number, size: number): HexCoord {
  const q = ((SQRT3 / 3) * x - y / 3) / size;
  const r = ((2 / 3) * y) / size;

  return fromAxial(cubeRound(q, r));
}

export function hexCorners(center: { x: number; y: number }, size: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    });
  }

  return corners;
}

function cubeRound(q: number, r: number): AxialHex {
  const x = q;
  const z = r;
  const y = -x - z;

  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);

  if (dx > dy && dx > dz) {
    rx = -ry - rz;
  } else if (dy > dz) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}
