import {
  mapDoubledBounds,
  mapTileCount,
  terrainAt,
  toDoubled,
  type HexCoord,
} from '../core/map';
import { findUnitAt, type GameState } from '../core/state';
import { TERRAIN_DEFS, type TerrainId } from '../core/terrain';
import { UNIT_DEFS, type UnitKind } from '../core/units';
import type { EditorTool } from './editorMenu';

export interface EditorHudInput {
  readonly mapName: string;
  readonly tool: EditorTool;
  readonly brush: TerrainId;
  readonly unitKind: UnitKind;
  readonly hover: HexCoord | null;
  readonly state: GameState;
}

export function buildEditorHud(input: EditorHudInput): string {
  const lines: string[] = [];

  lines.push(`Mapa: ${input.mapName}`);
  lines.push(`Tryb: ${input.tool === 'unit' ? 'jednostki' : 'teren'}`);

  if (input.tool === 'unit') {
    lines.push(`Jednostka: ${UNIT_DEFS[input.unitKind].label}`);
  } else {
    lines.push(`Pędzel: ${TERRAIN_DEFS[input.brush].label}`);
  }

  if (input.hover) {
    const terrain = terrainAt(input.state.map, input.hover);
    const unit = findUnitAt(input.state, input.hover);
    const hex = toDoubled(input.hover);

    let label = terrain ? ` — ${TERRAIN_DEFS[terrain].label}` : ' — pusto';

    if (unit) {
      label += ` · ${UNIT_DEFS[unit.kind].label}`;
    }

    lines.push(`Heks: ${hex.col},${hex.row}${label}`);
  } else {
    lines.push('Heks: —');
  }

  const bounds = mapDoubledBounds(input.state.map);
  lines.push(
    `Kafelki: ${mapTileCount(input.state.map)} · Jedn.: ${input.state.units.length}`,
  );

  if (bounds) {
    lines.push(`Zasięg: ${bounds.minCol}-${bounds.maxCol} × ${bounds.minRow}-${bounds.maxRow}`);
  } else {
    lines.push('Zasięg: —');
  }

  lines.push('');
  lines.push('LPM — maluj · PPM — usuń');
  lines.push('Klik — wybór w menu po lewej');
  lines.push('X — czyść mapę');
  lines.push('Shift+strzałki — wzrost mapy');
  lines.push('Kamera: strzałki/WASD lub krawędź');
  lines.push('Kółko — zoom');
  lines.push('ZAPISZ — mapa do SQLite');
  lines.push('ESC — mapy · Shift+ESC — menu');

  return lines.join('\n');
}
