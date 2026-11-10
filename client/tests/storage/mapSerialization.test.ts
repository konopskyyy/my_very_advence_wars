import { describe, expect, it } from 'vitest';
import { createMap, setFogOfWar, setTerrain } from '../../src/core/map';
import { createInitialState, placeUnit } from '../../src/core/state';
import { ARTILLERY_AMMO, shotsLeft, TANK_AMMO } from '../../src/core/units';
import { deserializeGameState, serializeGameState } from '../../src/storage/mapSerialization';

function sampleState() {
  let map = createMap(4, 3);

  map = setTerrain(map, { col: 1, row: 1 }, 'forest');
  map = setTerrain(map, { col: 2, row: 1 }, 'water');

  let state = createInitialState(map);

  state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
  state = placeUnit(state, 'tank', { col: 1, row: 0 }, 'red');
  state = placeUnit(state, 'artillery', { col: 1, row: 1 }, 'blue');
  state = placeUnit(state, 'scout', { col: 2, row: 2 }, 'red');

  return state;
}

describe('serializacja stanu gry', () => {
  it('przywraca mapę i jednostki po zapisie', () => {
    const state = sampleState();

    expect(deserializeGameState(serializeGameState(state))).toEqual(state);
  });

  it('zachowuje rodzaje jednostek i pociski wynikające z ruchu', () => {
    const restored = deserializeGameState(serializeGameState(sampleState()));
    const artillery = restored.units.find((unit) => unit.kind === 'artillery');

    expect(artillery?.kind).toBe('artillery');
    expect(artillery ? shotsLeft(artillery) : undefined).toBe(ARTILLERY_AMMO);
  });

  it('zapisuje i przywraca mgłę wojny', () => {
    const state = sampleState();
    const foggy = { ...state, map: setFogOfWar(state.map, true) };

    expect(deserializeGameState(serializeGameState(foggy)).map.fogOfWar).toBe(true);
  });

  it('traktuje brak flagi mgły w starym zapisie jako wyłączoną', () => {
    const json = JSON.stringify({
      map: { cells: { '0,0': 'plain' } },
      units: [],
      nextUnitSeq: 1,
    });

    expect(deserializeGameState(json).map.fogOfWar).toBe(false);
  });

  it('odrzuca niepoprawną flagę mgły', () => {
    const json = JSON.stringify({
      map: { cells: { '0,0': 'plain' }, fogOfWar: 'tak' },
      units: [],
      nextUnitSeq: 1,
    });

    expect(() => deserializeGameState(json)).toThrow('mgła wojny');
  });

  it('odrzuca uszkodzony JSON', () => {
    expect(() => deserializeGameState('{')).toThrow('to nie jest JSON');
  });

  it('odrzuca nieznany teren', () => {
    const json = JSON.stringify({
      map: { cells: { '0,0': 'lava' } },
      units: [],
      nextUnitSeq: 1,
    });

    expect(() => deserializeGameState(json)).toThrow('Nieprawidłowy kafelek');
  });

  it('ignoruje pole ammo ze starego zapisu', () => {
    const json = JSON.stringify({
      map: { cells: { '0,0': 'plain' } },
      units: [
        {
          id: 'u1',
          kind: 'tank',
          faction: 'blue',
          pos: { col: 0, row: 0 },
          hp: 20,
          movesLeft: 3,
          hasActed: false,
          ammo: 1,
        },
      ],
      nextUnitSeq: 2,
    });
    const tank = deserializeGameState(json).units[0]!;

    expect('ammo' in tank).toBe(false);
    expect(shotsLeft(tank)).toBe(TANK_AMMO);
  });
});
