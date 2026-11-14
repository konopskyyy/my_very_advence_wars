import type { Campaign, CampaignTile } from './types';

export function isMissionCompleted(
  tile: CampaignTile,
  completed: ReadonlySet<string>,
): boolean {
  return tile.mission !== undefined && completed.has(tile.mission.id);
}

export function isTileUnlocked(tile: CampaignTile, completed: ReadonlySet<string>): boolean {
  if (!tile.mission) {
    return false;
  }

  return tile.requiresMission === undefined || completed.has(tile.requiresMission);
}

export function prerequisiteTile(
  campaign: Campaign,
  tile: CampaignTile,
): CampaignTile | undefined {
  if (!tile.requiresMission) {
    return undefined;
  }

  return campaign.tiles.find((candidate) => candidate.mission?.id === tile.requiresMission);
}
