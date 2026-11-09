import Phaser from 'phaser';
import {
  clearMap,
  extendMap,
  generateMap,
  mapMemoryUsage,
  measureMapOperation,
  removeTerrain,
  setFogOfWar,
  setTerrain,
  terrainAt,
  type HexCoord,
  type MapDefinition,
  type MapEdge,
} from '../core/map';
import {
  createInitialState,
  placeUnit,
  removeUnitAt,
  type GameState,
} from '../core/state';
import type { TerrainId } from '../core/map/terrain';
import type { FactionId, UnitKind } from '../core/units';
import { devToolsEnabled } from '../devTools';
import { createSavedMapId, saveMap } from '../storage/maps';
import { EditorControls } from '../view/editorControls';
import { EditorMenu, type EditorMenuState, type EditorTool } from '../view/editorMenu';
import { EditorPanel } from '../view/editorPanel';
import { HexMapView } from '../view/hexGrid';
import { MapViewport } from '../view/mapViewport';
import { preloadTerrainTiles } from '../view/terrainTiles';
import { UnitLayer } from '../view/unitLayer';

type EditorTarget = 'menu' | 'map-menu' | 'scenario-menu';

interface EditorData {
  readonly definition?: MapDefinition;
  readonly state?: GameState;
  readonly returnTo?: EditorTarget;
}

export class MapEditorScene extends Phaser.Scene {
  private state: GameState = createInitialState(generateMap());
  private mapId: string | null = null;
  private mapName = 'nowa';
  private returnTo: EditorTarget = 'map-menu';
  private readonly devTools = devToolsEnabled();

  private tool: EditorTool = 'terrain';
  private brush: TerrainId = 'plain';
  private unitKind: UnitKind = 'infantry';
  private faction: FactionId = 'blue';
  private mapCpuMs = 0;
  private lastOperationMs = 0;
  private mapBytes = 0;
  private saving = false;

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private unitView!: UnitLayer;
  private menu!: EditorMenu;
  private panel!: EditorPanel;
  private controls!: EditorControls;

  constructor() {
    super('map-editor');
  }

  preload(): void {
    preloadTerrainTiles(this);
  }

  init(data: EditorData): void {
    const definition = data?.definition;

    this.mapId = definition?.id ?? null;
    this.mapName = definition?.name ?? 'nowa';
    this.returnTo = data?.returnTo ?? 'map-menu';
    this.state = this.measure(
      () => data?.state ?? createInitialState(definition?.map ?? generateMap()),
    );
  }

  create(): void {
    this.panel = new EditorPanel(this, this.mapName, this.devTools, {
      onNameChange: (name) => {
        this.mapName = name;
      },
      onNameFocus: () => {
        this.controls.releaseKeys();
      },
      onMapMenu: () => this.leaveTo('map-menu'),
      onMainMenu: () => this.leaveTo('menu'),
      onSave: () => void this.saveCurrentMap(),
      onCreateScenario: () => void this.createScenarioFromEditor(),
    });

    this.viewport = new MapViewport(this, this.state.map, {
      zoomMin: 0.75,
      zoomMax: 2.5,
      edgePanBlocked: (pointer) => this.panel.contains(pointer),
    });

    const renderStarted = performance.now();
    this.mapView = new HexMapView(this, this.state.map);
    this.unitView = new UnitLayer(this, this.state.units);
    this.mapCpuMs += performance.now() - renderStarted;
    this.mapBytes = mapMemoryUsage(this.state.map);

    this.menu = new EditorMenu(this, this.menuState(), {
      onTerrain: (terrain) => {
        this.tool = 'terrain';
        this.brush = terrain;
        this.refreshHud();
      },
      onUnit: (kind) => {
        this.tool = 'unit';
        this.unitKind = kind;
        this.refreshHud();
      },
      onFaction: (faction) => {
        this.faction = faction;
        this.refreshHud();
      },
      onFog: () => {
        this.state = this.measure(() => ({
          ...this.state,
          map: setFogOfWar(this.state.map, !this.state.map.fogOfWar),
        }));
        this.syncView();
      },
    });

    this.controls = new EditorControls(
      this,
      this.viewport,
      (pointer) => this.panel.contains(pointer),
      {
        isNameEditing: () => this.panel.isEditingName,
        commitName: () => this.panel.commitName(),
        handleNameKey: (event) => this.panel.handleNameKey(event),
        onHoverChange: () => this.refreshHud(),
        onPaint: (coord, button) => this.paintAt(coord, button),
        onClear: () => this.clearCurrentMap(),
        onExtend: (edge) => this.extendEdge(edge),
        onLeave: (shift) => this.leaveTo(shift ? 'menu' : this.returnTo),
      },
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.resetEditor, this);

    this.refreshHud();
  }

  private menuState(): EditorMenuState {
    return {
      tool: this.tool,
      brush: this.brush,
      unitKind: this.unitKind,
      faction: this.faction,
      fogOfWar: this.state.map.fogOfWar,
    };
  }

  private resetEditor(): void {
    this.controls?.destroy();
    this.state = createInitialState(generateMap());
    this.mapId = null;
    this.mapName = 'nowa';
    this.tool = 'terrain';
    this.brush = 'plain';
    this.unitKind = 'infantry';
    this.faction = 'blue';
    this.mapCpuMs = 0;
    this.lastOperationMs = 0;
    this.mapBytes = 0;
    this.saving = false;
  }

  update(_time: number, delta: number): void {
    this.refreshDevBar(delta);
    this.controls.update(delta);
  }

  private extendEdge(edge: MapEdge): void {
    this.state = this.measure(() => ({
      ...this.state,
      map: extendMap(this.state.map, edge, 1, this.brush),
    }));
    this.syncView();
  }

  private clearCurrentMap(): void {
    this.state = this.measure(() => createInitialState(clearMap()));
    this.controls.clearHover();
    this.syncView();
  }

  private measure<T>(operation: () => T): T {
    const measured = measureMapOperation(operation);

    this.mapCpuMs += measured.ms;
    this.lastOperationMs = measured.ms;

    return measured.result;
  }

  private leaveTo(target: EditorTarget): void {
    if (this.panel.isEditingName) {
      this.panel.commitName();
    }

    if (this.mapId) {
      this.registry.set(`map:draft:${this.mapId}`, this.state);
    }

    this.scene.start(target);
  }

  private async saveCurrentMap(): Promise<void> {
    if (this.saving) {
      return;
    }

    if (this.panel.isEditingName) {
      this.panel.commitName();
    }

    this.saving = true;

    const id = this.mapId ?? createSavedMapId();
    const name = this.mapName === 'nowa' ? 'Mapa lokalna' : this.mapName;

    try {
      await saveMap({
        id,
        name,
        description: 'Mapa zapisana w edytorze',
        state: this.state,
      });

      this.mapId = id;
      this.mapName = name;
      this.panel.setName(name);
      this.panel.setSaveStatus('ZAPISANO');
      this.refreshHud();

      this.time.delayedCall(1400, () => this.panel.setSaveStatus('ZAPISZ'));
    } catch (error) {
      console.error('Nie udało się zapisać mapy w SQLite', error);
      this.panel.setSaveStatus('BŁĄD ZAPISU');

      this.time.delayedCall(1800, () => this.panel.setSaveStatus('ZAPISZ'));
    } finally {
      this.saving = false;
    }
  }

  private paintAt(coord: HexCoord, button: number): void {
    if (this.tool === 'unit') {
      if (!terrainAt(this.state.map, coord)) {
        return;
      }

      this.state = this.measure(() =>
        button === 2
          ? removeUnitAt(this.state, coord)
          : placeUnit(this.state, this.unitKind, coord, this.faction),
      );
      this.syncView();
      return;
    }

    const map = this.measure(() =>
      button === 2
        ? removeTerrain(this.state.map, coord)
        : setTerrain(this.state.map, coord, this.brush),
    );

    this.state =
      button === 2
        ? removeUnitAt({ ...this.state, map }, coord)
        : { ...this.state, map };

    this.syncView();
  }

  private syncView(): void {
    const started = performance.now();
    this.mapView.setMap(this.state.map);
    this.unitView.setUnits(this.state.units, false);
    this.mapCpuMs += performance.now() - started;
    this.mapBytes = mapMemoryUsage(this.state.map);

    this.viewport.setMap(this.state.map);
    this.refreshHud();
  }

  private refreshHud(): void {
    this.panel.refresh({
      mapName: this.mapName,
      tool: this.tool,
      brush: this.brush,
      unitKind: this.unitKind,
      hover: this.controls.currentHover,
      state: this.state,
    });
    this.menu.refresh(this.menuState());
  }

  private refreshDevBar(delta: number): void {
    this.panel.updateDevBar(delta, {
      tiles: this.mapView.tileCount,
      cpuMs: this.mapCpuMs,
      lastOperationMs: this.lastOperationMs,
      mapBytes: this.mapBytes,
    });
  }

  private async createScenarioFromEditor(): Promise<void> {
    await this.saveCurrentMap();
    this.scene.start('scenario-menu');
  }
}
