import type { TurnLog } from './log';
import { FACTION_DEFS, UNIT_DEFS } from '../units';

export function formatTurnLog(log: TurnLog): readonly string[] {
  const lines = [
    `TURA ${log.turn} — ${FACTION_DEFS[log.faction].label} · obrażenia ${log.damageTotal}`,
  ];

  if (log.moves.length === 0 && log.attacks.length === 0) {
    lines.push('  brak akcji');
    return lines;
  }

  for (const move of log.moves) {
    lines.push(
      `  ${UNIT_DEFS[move.kind].label}: (${move.from.col},${move.from.row}) → (${move.to.col},${move.to.row})`,
    );
  }

  for (const attack of log.attacks) {
    const killed = attack.killed ? ' · zniszczony' : '';

    lines.push(
      `  ${UNIT_DEFS[attack.unitKind].label} → ${UNIT_DEFS[attack.targetKind].label}: ${attack.damage} obr.${killed}`,
    );
  }

  return lines;
}
