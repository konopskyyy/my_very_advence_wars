import type { SiRule } from '../rule';
import { EngageOrAdvanceRule } from './engageOrAdvance';

export const SI_RULES: readonly SiRule[] = [new EngageOrAdvanceRule()].sort(
  (left, right) => right.priority - left.priority,
);
