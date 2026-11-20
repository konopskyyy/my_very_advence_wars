export const BAR_WIDTH = 160;
export const BAR_PADDING = 16;
export const HUD_MARGIN = 12;
export const HUD_GAP = 8;
export const MINIMAP_HEIGHT = 132;
export const MINIMAP_PANEL_HEIGHT = 156;
export const PLANNER_EXPANDED = 168;
export const PLANNER_COLLAPSED = 36;

export interface BottomPanels {
  readonly minimapWidth: number;
  readonly minimapLeft: number;
  readonly plannerWidth: number;
  readonly plannerLeft: number;
}

export function bottomPanels(areaWidth: number): BottomPanels {
  const available = Math.max(1, areaWidth - HUD_MARGIN * 2 - HUD_GAP);
  const minimapWidth = Math.floor(available / 4);

  return {
    minimapWidth,
    minimapLeft: HUD_MARGIN,
    plannerWidth: available - minimapWidth,
    plannerLeft: HUD_MARGIN + minimapWidth + HUD_GAP,
  };
}
