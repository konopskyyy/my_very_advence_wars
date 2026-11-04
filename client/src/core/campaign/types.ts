import type { ScenarioDefinition } from '../scenario';

export type CampaignId = 'tutorial' | 'campaign-1' | 'campaign-2';

export interface CampaignTile {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly mission?: ScenarioDefinition;
}

export interface Campaign {
  readonly id: CampaignId;
  readonly title: string;
  readonly description: string;
  readonly tiles: readonly CampaignTile[];
}
