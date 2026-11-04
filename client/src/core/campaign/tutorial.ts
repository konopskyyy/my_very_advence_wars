import { AMUNICJA } from './missions/amunicja';
import { ARTYLERIA } from './missions/artyleria';
import { MGLA_WOJNY } from './missions/mgla-wojny';
import { PIERWSZE_KROKI } from './missions/pierwsze-kroki';
import { RUCH_JEDNOSTEK } from './missions/ruch-jednostek';
import { WALKA } from './missions/walka';
import type { Campaign } from './types';

export const TUTORIAL: Campaign = {
  id: 'tutorial',
  title: 'Samouczek',
  description: 'Poznaj mapę, jednostki i najważniejsze zasady rozgrywki.',
  tiles: [PIERWSZE_KROKI, RUCH_JEDNOSTEK, WALKA, MGLA_WOJNY, AMUNICJA, ARTYLERIA],
};
