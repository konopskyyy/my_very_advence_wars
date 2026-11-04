import { describe, expect, it } from 'vitest';
import { CAMPAIGNS, findCampaign } from '../../../src/core/campaign';

describe('kampanie', () => {
  it('lista kampanie w kolejności samouczek, kampania 1, kampania 2', () => {
    expect(CAMPAIGNS.map((campaign) => campaign.id)).toEqual([
      'tutorial',
      'campaign-1',
      'campaign-2',
    ]);
    expect(CAMPAIGNS.map((campaign) => campaign.title)).toEqual([
      'Samouczek',
      'Kampania 1',
      'Kampania 2',
    ]);
  });

  it('samouczek ma sześć kafelków, a pierwszy to Pierwsze kroki', () => {
    const tutorial = findCampaign('tutorial');

    expect(tutorial?.tiles).toHaveLength(6);
    expect(tutorial?.tiles[0]?.title).toBe('Pierwsze kroki');
    expect(tutorial?.tiles[0]?.mission).toBeDefined();
    expect(tutorial?.tiles.slice(1).every((tile) => tile.mission === undefined)).toBe(true);
  });

  it('kampanie 1 i 2 nie mają jeszcze kafelków', () => {
    expect(findCampaign('campaign-1')?.tiles).toHaveLength(0);
    expect(findCampaign('campaign-2')?.tiles).toHaveLength(0);
  });
});
