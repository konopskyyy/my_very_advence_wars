import { describe, expect, it } from 'vitest';
import {
  isMissionCompleted,
  isTileUnlocked,
  prerequisiteTile,
} from '../../../src/core/campaign/progress';
import { TUTORIAL } from '../../../src/core/campaign/tutorial';
import { PIERWSZE_KROKI } from '../../../src/core/campaign/missions/pierwsze-kroki';
import { RUCH_JEDNOSTEK } from '../../../src/core/campaign/missions/ruch-jednostek';

const NOTHING = new Set<string>();
const FIRST_DONE = new Set(['tutorial-pierwsze-kroki']);

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

  it('kafelek zapowiedzi nie jest ani dostępny, ani ukończony', () => {
    const preview = TUTORIAL.tiles[2]!;

    expect(preview.mission).toBeUndefined();
    expect(isTileUnlocked(preview, FIRST_DONE)).toBe(false);
    expect(isMissionCompleted(preview, new Set(['cokolwiek']))).toBe(false);
  });

  it('wskazuje kafelek wymaganej misji', () => {
    expect(prerequisiteTile(TUTORIAL, RUCH_JEDNOSTEK)).toBe(PIERWSZE_KROKI);
    expect(prerequisiteTile(TUTORIAL, PIERWSZE_KROKI)).toBeUndefined();
  });
});
