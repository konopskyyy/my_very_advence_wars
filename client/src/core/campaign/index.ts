import { KAMPANIA_1 } from './kampania-1';
import { KAMPANIA_2 } from './kampania-2';
import { TUTORIAL } from './tutorial';
import type { Campaign, CampaignId } from './types';

export * from './types';

export const CAMPAIGNS: readonly Campaign[] = [TUTORIAL, KAMPANIA_1, KAMPANIA_2];

export function findCampaign(id: CampaignId): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}
