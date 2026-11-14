import { describe, expect, it } from 'vitest';
import { formatTurnLog } from '../../../src/core/plan/logText';

describe('formatTurnLog', () => {
  it('wypisuje turę, ruchy i ataki z obrażeniami', () => {
    const lines = formatTurnLog({
      turn: 2,
      faction: 'blue',
      damageTotal: 12,
      moves: [
        {
          unitId: 'u1',
          kind: 'infantry',
          from: { col: 1, row: 1 },
          to: { col: 2, row: 1 },
        },
      ],
      attacks: [
        {
          unitId: 'u1',
          unitKind: 'infantry',
          targetId: 'u2',
          targetKind: 'tank',
          damage: 12,
          killed: true,
        },
      ],
    });

    expect(lines[0]).toContain('TURA 2');
    expect(lines[0]).toContain('obrażenia 12');
    expect(lines[1]).toContain('(1,1) → (2,1)');
    expect(lines[2]).toContain('12 obr.');
    expect(lines[2]).toContain('zniszczony');
  });

  it('oznacza turę bez akcji', () => {
    const lines = formatTurnLog({
      turn: 1,
      faction: 'red',
      damageTotal: 0,
      moves: [],
      attacks: [],
    });

    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('brak akcji');
  });
});
