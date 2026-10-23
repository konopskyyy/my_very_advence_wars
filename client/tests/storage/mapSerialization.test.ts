import { describe, expect, it } from 'vitest';
import { createMap, setTerrain } from '../../src/core/map';
import { createInitialState, placeUnit } from '../../src/core/state';
import {
  deserializeGameState,
  serializeGameState,
} from '../../src/storage/mapSerialization';

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

  it('zachowuje rodzaje jednostek i amunicję', () => {
    const restored = deserializeGameState(serializeGameState(sampleState()));
    const artillery = restored.units.find((unit) => unit.kind === 'artillery');

    expect(artillery?.kind).toBe('artillery');
    expect(artillery?.kind === 'artillery' ? artillery.ammo : undefined).toBe(6);
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

  it('odrzuca jednostkę bez amunicji', () => {
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
        },
      ],
      nextUnitSeq: 2,
    });

    expect(() => deserializeGameState(json)).toThrow('amunicja');
  });
});
