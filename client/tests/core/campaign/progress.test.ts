import { describe, expect, it } from 'vitest';
import {
  isMissionCompleted,
  isTileUnlocked,
  prerequisiteTile,
  tileStatus,
} from '../../../src/core/campaign/progress';
import { TUTORIAL } from '../../../src/core/campaign/tutorial';
import { PIERWSZE_KROKI } from '../../../src/core/campaign/missions/pierwsze-kroki';
import { RUCH_JEDNOSTEK } from '../../../src/core/campaign/missions/ruch-jednostek';
import { WALKA } from '../../../src/core/campaign/missions/walka';

const NOTHING = new Set<string>();
const FIRST_DONE = new Set(['tutorial-pierwsze-kroki']);
const SECOND_DONE = new Set(['tutorial-pierwsze-kroki', 'tutorial-ruch-jednostek']);

describe('postęp kampanii', () => {
  it('pierwsza misja jest dostępna bez ukończonych lekcji', () => {
    expect(isTileUnlocked(PIERWSZE_KROKI, NOTHING)).toBe(true);
    expect(isTileUnlocked(RUCH_JEDNOSTEK, NOTHING)).toBe(false);
  });

  it('druga misja odblokowuje się po ukończeniu pierwszej', () => {
    expect(isTileUnlocked(RUCH_JEDNOSTEK, FIRST_DONE)).toBe(true);
  });

  it('ukończenie liczy się tylko dla własnego identyfikatora misji', () => {
    expect(isMissionCompleted(PIERWSZE_KROKI, FIRST_DONE)).toBe(true);
    expect(isMissionCompleted(RUCH_JEDNOSTEK, FIRST_DONE)).toBe(false);
    expect(isMissionCompleted(RUCH_JEDNOSTEK, new Set(['tutorial-ruch-jednostek']))).toBe(true);
  });

  it('trzecia misja odblokowuje się po drugim akcie, a czwarty kafelek pozostaje zapowiedzią', () => {
    expect(isTileUnlocked(WALKA, FIRST_DONE)).toBe(false);
    expect(isTileUnlocked(WALKA, SECOND_DONE)).toBe(true);

    const fourth = TUTORIAL.tiles[3]!;

    expect(fourth.mission).toBeUndefined();
    expect(fourth.requiresMission).toBe('tutorial-walka');
    expect(isTileUnlocked(fourth, SECOND_DONE)).toBe(false);
    expect(isTileUnlocked(fourth, new Set([...SECOND_DONE, 'tutorial-walka']))).toBe(false);
  });

  it('kafelek zapowiedzi nie jest ani dostępny, ani ukończony', () => {
    const preview = TUTORIAL.tiles[4]!;

    expect(preview.mission).toBeUndefined();
    expect(isTileUnlocked(preview, FIRST_DONE)).toBe(false);
    expect(isMissionCompleted(preview, new Set(['cokolwiek']))).toBe(false);
  });

  it('wskazuje kafelek wymaganej misji', () => {
    expect(prerequisiteTile(TUTORIAL, RUCH_JEDNOSTEK)).toBe(PIERWSZE_KROKI);
    expect(prerequisiteTile(TUTORIAL, WALKA)).toBe(RUCH_JEDNOSTEK);
    expect(prerequisiteTile(TUTORIAL, TUTORIAL.tiles[3]!)).toBe(WALKA);
    expect(prerequisiteTile(TUTORIAL, PIERWSZE_KROKI)).toBeUndefined();
  });

  it('lista zadań rozróżnia ukończone, gotowe, zablokowane i zapowiedzi', () => {
    expect(tileStatus(PIERWSZE_KROKI, NOTHING)).toBe('ready');
    expect(tileStatus(PIERWSZE_KROKI, FIRST_DONE)).toBe('completed');
    expect(tileStatus(RUCH_JEDNOSTEK, NOTHING)).toBe('locked');
    expect(tileStatus(RUCH_JEDNOSTEK, FIRST_DONE)).toBe('ready');
    expect(tileStatus(WALKA, SECOND_DONE)).toBe('ready');
    expect(tileStatus(TUTORIAL.tiles[3]!, SECOND_DONE)).toBe('preview');
    expect(tileStatus(TUTORIAL.tiles[4]!, FIRST_DONE)).toBe('preview');
  });
});
