import type { TurnPlan } from '../core/plan';
import type { SiContext } from './types';

export abstract class SiRule {
  abstract readonly priority: number;

  abstract canBeUsed(context: SiContext): boolean;

  abstract perform(context: SiContext): TurnPlan;
}
