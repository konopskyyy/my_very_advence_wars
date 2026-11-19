import { DEFAULT_LOADOUT, loadoutPrice, type Loadout } from './loadout';
import { UNIT_DEFS, UNIT_KINDS, type UnitKind } from './units';

export const DEFAULT_FUNDS = 1000;

export interface RecruitmentGrant {
  readonly after: UnitKind;
  readonly funds: number;
  readonly allowedKinds?: readonly UnitKind[];
  readonly limits?: Partial<Record<UnitKind, number>>;
}

export interface RecruitmentRules {
  readonly funds?: number;
  readonly allowedKinds?: readonly UnitKind[];
  readonly limits?: Partial<Record<UnitKind, number>>;
  readonly grants?: readonly RecruitmentGrant[];
}

export interface RecruitmentState {
  readonly funds: number;
  readonly allowedKinds: readonly UnitKind[];
  readonly limits: Partial<Record<UnitKind, number>>;
  readonly grants: readonly RecruitmentGrant[];
  readonly purchased: Partial<Record<UnitKind, number>>;
  readonly appliedGrants: readonly number[];
}

export interface RecruitmentReward {
  readonly funds?: number;
  readonly allowedKinds?: readonly UnitKind[];
  readonly limits?: Partial<Record<UnitKind, number>>;
}

export type RecruitmentDenial = 'forbidden' | 'limit' | 'funds';

export function createRecruitment(rules?: RecruitmentRules): RecruitmentState {
  return {
    funds: rules?.funds ?? DEFAULT_FUNDS,
    allowedKinds: rules?.allowedKinds ?? UNIT_KINDS,
    limits: rules?.limits ?? {},
    grants: rules?.grants ?? [],
    purchased: {},
    appliedGrants: [],
  };
}

export function applyRecruitmentReward(
  state: RecruitmentState,
  reward: RecruitmentReward,
): RecruitmentState {
  const unlocked = new Set<UnitKind>([...state.allowedKinds, ...(reward.allowedKinds ?? [])]);

  return {
    ...state,
    funds: state.funds + (reward.funds ?? 0),
    allowedKinds: [...unlocked],
    limits: { ...state.limits, ...(reward.limits ?? {}) },
  };
}

export function unitCost(kind: UnitKind): number {
  return UNIT_DEFS[kind].cost;
}

export function totalCost(kind: UnitKind, loadout: Loadout = DEFAULT_LOADOUT): number {
  return unitCost(kind) + loadoutPrice(loadout);
}

export function remainingPurchases(state: RecruitmentState, kind: UnitKind): number | undefined {
  const limit = state.limits[kind];

  return limit === undefined ? undefined : Math.max(0, limit - (state.purchased[kind] ?? 0));
}

export function canAfford(
  state: RecruitmentState,
  kind: UnitKind,
  loadout: Loadout = DEFAULT_LOADOUT,
): boolean {
  return state.funds >= totalCost(kind, loadout);
}

export function recruitmentDenial(
  state: RecruitmentState,
  kind: UnitKind,
  loadout: Loadout = DEFAULT_LOADOUT,
): RecruitmentDenial | undefined {
  if (!state.allowedKinds.includes(kind)) {
    return 'forbidden';
  }

  const remaining = remainingPurchases(state, kind);

  if (remaining !== undefined && remaining <= 0) {
    return 'limit';
  }

  return canAfford(state, kind, loadout) ? undefined : 'funds';
}

export function purchaseUnit(
  state: RecruitmentState,
  kind: UnitKind,
  loadout: Loadout = DEFAULT_LOADOUT,
): RecruitmentState | undefined {
  if (recruitmentDenial(state, kind, loadout)) {
    return undefined;
  }

  let next: RecruitmentState = {
    ...state,
    funds: state.funds - totalCost(kind, loadout),
    purchased: { ...state.purchased, [kind]: (state.purchased[kind] ?? 0) + 1 },
  };

  state.grants.forEach((grant, index) => {
    if (grant.after !== kind || next.appliedGrants.includes(index)) {
      return;
    }

    next = {
      ...next,
      funds: next.funds + grant.funds,
      allowedKinds: grant.allowedKinds ?? next.allowedKinds,
      limits: { ...next.limits, ...(grant.limits ?? {}) },
      appliedGrants: [...next.appliedGrants, index],
    };
  });

  return next;
}
