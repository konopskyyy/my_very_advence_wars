import type { HexCoord } from '../core/map';
import type { TurnPlan } from '../core/plan';
import type { GameState } from '../core/state';
import type { Unit } from '../core/units';

export interface SiContext {
  readonly state: GameState;
  readonly plan: TurnPlan;
  readonly unit: Unit;
  readonly spawn: HexCoord;
}
