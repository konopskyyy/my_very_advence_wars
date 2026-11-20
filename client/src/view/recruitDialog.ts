import Phaser from 'phaser';
import {
  FACTION_DEFS,
  UNIT_DEFS,
  UNIT_KINDS,
  type FactionId,
  type UnitKind,
} from '../core/units';
import {
  DEFAULT_LOADOUT,
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS,
  type Loadout,
} from '../core/loadout';
import {
  recruitmentDenial,
  remainingPurchases,
  totalCost,
  type RecruitmentDenial,
  type RecruitmentState,
} from '../core/recruitment';
import { FACTION_THEMES, type FactionTheme } from './factionTheme';
import { BAR_WIDTH } from './hudLayout';
import { formatPoints, formatRange } from './format';
import { loadoutPortraitKey, recruitPortraitKey } from './recruitPortrait';

const PANEL_MAX_WIDTH = 1160;
const PANEL_MAX_HEIGHT = 640;
const PANEL_MARGIN = 24;
const DEPTH = 40;
const HEADER_HEIGHT = 54;
const FOOTER_HEIGHT = 58;
const CARD_WIDTH = 184;
const CARD_HEIGHT = 236;
const CARD_GAP = 10;
const CARD_PORTRAIT_TOP = 12;
const CARD_PORTRAIT_SIZE = 148;

interface UnitRow {
  readonly kind: UnitKind;
  readonly container: Phaser.GameObjects.Container;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly portrait: Phaser.GameObjects.Image;
  readonly name: Phaser.GameObjects.Text;
  readonly price: Phaser.GameObjects.Text;
}

interface LoadoutDropdown {
  readonly slotIndex: number;
  readonly field: Phaser.GameObjects.Rectangle;
  readonly value: Phaser.GameObjects.Text;
  readonly popup: Phaser.GameObjects.Rectangle;
  readonly options: readonly Phaser.GameObjects.Text[];
}

const UNIT_ROLES: Record<UnitKind, string> = {
  infantry: 'ŻOŁNIERZ · piechota liniowa',
  tank: 'POJAZD · czołg',
  artillery: 'POJAZD · artyleria',
  scout: 'ŻOŁNIERZ · zwiadowca',
  bomber: 'LOTNICTWO · bombowiec',
  helicopter: 'LOTNICTWO · śmigłowiec',
};

export interface RecruitDialogHandlers {
  readonly onRecruit?: (kind: UnitKind, loadout: Loadout) => boolean;
  readonly onSelectKind?: (kind: UnitKind) => void;
}

const LOADOUT_SLOTS = [
  { label: 'Broń podstawowa', options: PRIMARY_WEAPONS },
  { label: 'Broń dodatkowa', options: SECONDARY_WEAPONS },
] as const;

function denialMessage(denial: RecruitmentDenial): string {
  switch (denial) {
    case 'forbidden':
      return 'Niedostępne w tej misji';
    case 'limit':
      return 'Limit zakupów wyczerpany';
    case 'funds':
      return 'Za mało środków';
  }
}

export class RecruitDialog {
  private readonly objects: Array<
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  > = [];
  private readonly rows: UnitRow[] = [];
  private readonly dropdowns: LoadoutDropdown[] = [];
  private openDropdown: number | null = null;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly accent: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly portraitFrame: Phaser.GameObjects.Rectangle;
  private readonly portraitImage: Phaser.GameObjects.Image;
  private readonly scrollBar: Phaser.GameObjects.Rectangle;
  private readonly listX: number;
  private readonly listY: number;
  private readonly listWidth: number;
  private readonly listHeight: number;
  private readonly cardWidth: number;
  private readonly cardPortraitSize: number;
  private readonly portraitDisplaySize: number;
  private readonly cardColumns: number;
  private readonly cardStepX: number;
  private readonly cardStepY: number;
  private readonly cardOffsetX: number;
  private scrollY = 0;
  private scrollMax = 0;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly roleText: Phaser.GameObjects.Text;
  private readonly statsText: Phaser.GameObjects.Text;
  private readonly equipmentTitle: Phaser.GameObjects.Text;
  private readonly recruitButton: Phaser.GameObjects.Rectangle;
  private readonly recruitLabel: Phaser.GameObjects.Text;
  private readonly recruitNotice: Phaser.GameObjects.Text;
  private readonly balanceText: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Rectangle;
  private readonly selection: Record<UnitKind, Loadout> = Object.fromEntries(
    UNIT_KINDS.map((kind) => [kind, { ...DEFAULT_LOADOUT }]),
  ) as Record<UnitKind, Loadout>;
  private theme: FactionTheme = FACTION_THEMES.blue;
  private faction: FactionId = 'blue';
  private selectedKind: UnitKind = 'infantry';
  private recruitment: RecruitmentState | null = null;
  private open = false;

  constructor(
    scene: Phaser.Scene,
    private readonly handlers: RecruitDialogHandlers = {},
  ) {
    const centerX = (scene.scale.width - BAR_WIDTH) / 2;
    const centerY = scene.scale.height / 2;
    const panelWidth = Math.min(PANEL_MAX_WIDTH, scene.scale.width - BAR_WIDTH - PANEL_MARGIN * 2);
    const panelHeight = Math.min(PANEL_MAX_HEIGHT, scene.scale.height - PANEL_MARGIN * 2);
    const panelX = centerX - panelWidth / 2;
    const panelY = centerY - panelHeight / 2;
    const contentTop = panelY + HEADER_HEIGHT;
    const contentHeight = panelHeight - HEADER_HEIGHT - FOOTER_HEIGHT;
    const listX = panelX + 20;
    const listY = contentTop;
    const listWidth = Math.floor((panelWidth - 60) * 0.54);
    const listHeight = contentHeight;
    const rightX = listX + listWidth + 20;
    const rightWidth = panelWidth - (rightX - panelX) - 20;
    const portraitX = rightX;
    const portraitY = contentTop;
    const portraitWidth = 190;
    const portraitHeight = 220;
    this.portraitDisplaySize = portraitWidth - 20;
    const infoX = rightX + portraitWidth + 16;
    const infoWidth = rightWidth - portraitWidth - 16;
    const buttonCenterX = rightX + rightWidth / 2;

    this.listX = listX;
    this.listY = listY;
    this.listWidth = listWidth;
    this.listHeight = listHeight;
    this.cardWidth = Math.min(CARD_WIDTH, listWidth - 8);
    this.cardPortraitSize = Math.min(CARD_PORTRAIT_SIZE, this.cardWidth - 20);
    this.cardColumns = Math.max(
      1,
      Math.floor((listWidth + CARD_GAP) / (this.cardWidth + CARD_GAP)),
    );
    this.cardStepX = this.cardWidth + CARD_GAP;
    this.cardStepY = CARD_HEIGHT + CARD_GAP;
    this.cardOffsetX =
      (listWidth - (this.cardColumns * this.cardWidth + (this.cardColumns - 1) * CARD_GAP)) / 2;

    this.overlay = this.register(
      scene.add
        .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x05080c, 0.62)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH)
        .setInteractive({ useHandCursor: true }),
    );

    this.panel = this.register(
      scene.add
        .rectangle(centerX, centerY, panelWidth, panelHeight, this.theme.barBackground, 0.98)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setStrokeStyle(1, this.theme.accent, 1)
        .setInteractive(),
    );

    this.accent = this.register(
      scene.add
        .rectangle(panelX + 20, panelY + 46, panelWidth - 40, 2, this.theme.accent, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.title = this.register(
      scene.add
        .text(centerX, panelY + 14, 'REKRUTACJA', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: this.theme.accentSoft,
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.balanceText = this.register(
      scene.add
        .text(panelX + panelWidth - 20, panelY + 18, '', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#f2d35c',
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.register(
      scene.add
        .rectangle(listX, listY, listWidth, listHeight, 0x05080c, 0.7)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setStrokeStyle(1, this.theme.divider, 1),
    );

    const maskShape = scene.make.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(listX, listY, listWidth, listHeight);
    const mask = maskShape.createGeometryMask();

    this.scrollBar = this.register(
      scene.add
        .rectangle(listX + listWidth - 6, listY + 2, 4, 40, this.theme.accentBright, 0.8)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 4)
        .setVisible(false),
    );

    const cardNameY = CARD_PORTRAIT_TOP + this.cardPortraitSize + 10;
    const cardPriceY = cardNameY + 28;

    UNIT_KINDS.forEach((kind, index) => {
      const cardColumn = index % this.cardColumns;
      const cardRow = Math.floor(index / this.cardColumns);
      const container = scene.add
        .container(
          listX + this.cardOffsetX + cardColumn * this.cardStepX,
          listY + cardRow * this.cardStepY,
        )
        .setScrollFactor(0)
        .setDepth(DEPTH + 2)
        .setMask(mask);
      const background = scene.add
        .rectangle(0, 0, this.cardWidth, CARD_HEIGHT, 0x0f1114, 0.5)
        .setOrigin(0, 0)
        .setStrokeStyle(1, this.theme.divider, 1)
        .setInteractive({ useHandCursor: true });
      const portrait = scene.add
        .image(this.cardWidth / 2, CARD_PORTRAIT_TOP, recruitPortraitKey(kind))
        .setDisplaySize(this.cardPortraitSize, this.cardPortraitSize)
        .setOrigin(0.5, 0);
      const name = scene.add
        .text(this.cardWidth / 2, cardNameY, UNIT_DEFS[kind].label, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#d8e2dc',
          align: 'center',
          wordWrap: { width: this.cardWidth - 12 },
        })
        .setOrigin(0.5, 0);
      const price = scene.add
        .text(this.cardWidth / 2, cardPriceY, '', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#f2d35c',
          align: 'center',
        })
        .setOrigin(0.5, 0);

      container.add([background, portrait, name, price]);
      this.register(container);
      this.register(background);
      this.register(portrait);
      this.register(name);
      this.register(price);

      background.on('pointerover', () => {
        if (this.selectedKind !== kind) {
          background.setFillStyle(this.theme.accentDark, 0.75);
        }
      });
      background.on('pointerout', () => {
        if (this.selectedKind !== kind) {
          background.setFillStyle(0x0f1114, 0.5);
        }
      });
      background.on('pointerdown', () => this.selectUnit(kind));

      this.rows.push({ kind, container, background, portrait, name, price });
    });

    scene.input.on('wheel', this.onWheel, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('wheel', this.onWheel, this);
    });

    this.portraitFrame = this.register(
      scene.add
        .rectangle(portraitX, portraitY, portraitWidth, portraitHeight, 0x05080c, 0.75)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setStrokeStyle(1, this.theme.divider, 1),
    );

    this.portraitImage = this.register(
      scene.add
        .image(
          portraitX + portraitWidth / 2,
          portraitY + portraitHeight / 2,
          recruitPortraitKey('infantry'),
        )
        .setDisplaySize(this.portraitDisplaySize, this.portraitDisplaySize)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.nameText = this.register(
      scene.add
        .text(infoX, portraitY + 8, '', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.roleText = this.register(
      scene.add
        .text(infoX, portraitY + 38, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.statsText = this.register(
      scene.add
        .text(infoX, portraitY + 64, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#d8e2dc',
          wordWrap: { width: infoWidth },
          lineSpacing: 2,
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.equipmentTitle = this.register(
      scene.add
        .text(infoX, portraitY + 150, 'WYPOSAŻENIE', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: this.theme.accentSoft,
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    const loadoutBaseY = portraitY + 166;

    LOADOUT_SLOTS.forEach((slot, slotIndex) => {
      const optionCount = slot.options.length;
      const y = loadoutBaseY + slotIndex * 120;

      this.register(
        scene.add
          .text(infoX, y, slot.label.toUpperCase(), {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: this.theme.accentSoft,
          })
          .setScrollFactor(0)
          .setDepth(DEPTH + 3),
      );

      const field = this.register(
        scene.add
          .rectangle(infoX, y + 18, infoWidth, 26, this.theme.accentDark, 1)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH + 3)
          .setStrokeStyle(1, this.theme.divider, 1)
          .setInteractive({ useHandCursor: true }),
      );

      const value = this.register(
        scene.add
          .text(infoX + 10, y + 31, '', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#f2f5f7',
          })
          .setScrollFactor(0)
          .setDepth(DEPTH + 4),
      );

      this.register(
        scene.add
          .text(infoX + infoWidth - 22, y + 28, '▾', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: this.theme.accentSoft,
          })
          .setScrollFactor(0)
          .setDepth(DEPTH + 4),
      );

      const popup = this.register(
        scene.add
          .rectangle(infoX, y + 44, infoWidth, optionCount * 24 + 6, 0x0b0e12, 1)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH + 4)
          .setStrokeStyle(1, this.theme.accentBright, 0.9)
          .setVisible(false),
      );

      const options = slot.options.map((option, optionIndex) => {
        const text = this.register(
          scene.add
            .text(infoX + 10, y + 48 + optionIndex * 24, option.label, {
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#9fb0a5',
            })
            .setScrollFactor(0)
            .setDepth(DEPTH + 5)
            .setInteractive({ useHandCursor: true })
            .setVisible(false),
        );

        text.on('pointerdown', () => this.selectWeapon(slotIndex, optionIndex));

        return text;
      });

      field.on('pointerdown', () => this.toggleDropdown(slotIndex));
      this.dropdowns.push({ slotIndex, field, value, popup, options });
    });

    const buttonY = panelY + panelHeight - 32;

    this.recruitNotice = this.register(
      scene.add
        .text(buttonCenterX, buttonY - 24, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffb347',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.recruitButton = this.register(
      scene.add
        .rectangle(buttonCenterX - 84, buttonY, 160, 32, this.theme.accentDark, 1)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    this.recruitLabel = this.register(
      scene.add
        .text(buttonCenterX - 84, buttonY, 'KUP JEDNOSTKĘ', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH + 3),
    );

    this.closeButton = this.register(
      scene.add
        .rectangle(buttonCenterX + 84, buttonY, 140, 32, this.theme.accentDark, 1)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    this.register(
      scene.add
        .text(buttonCenterX + 84, buttonY, 'ZAMKNIJ', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH + 3),
    );

    this.overlay.on('pointerup', () => this.hide());
    this.recruitButton.on('pointerover', () =>
      this.recruitButton.setFillStyle(this.theme.accent, 1),
    );
    this.recruitButton.on('pointerout', () =>
      this.recruitButton.setFillStyle(this.theme.accentDark, 1),
    );
    this.recruitButton.on('pointerup', () => this.tryRecruit());
    this.closeButton.on('pointerover', () =>
      this.closeButton.setFillStyle(this.theme.accent, 1),
    );
    this.closeButton.on('pointerout', () =>
      this.closeButton.setFillStyle(this.theme.accentDark, 1),
    );
    this.closeButton.on('pointerup', () => this.hide());

    this.setVisible(false);
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(faction: FactionId, recruitment: RecruitmentState): void {
    this.open = true;
    this.faction = faction;
    this.recruitment = recruitment;
    this.recruitNotice.setText('');
    this.scrollY = 0;
    this.selectedKind = recruitment.allowedKinds.includes(this.selectedKind)
      ? this.selectedKind
      : (recruitment.allowedKinds[0] ?? this.selectedKind);
    this.applyTheme(FACTION_THEMES[faction]);
    this.setVisible(true);
    this.closeDropdowns();
    this.render();
    this.handlers.onSelectKind?.(this.selectedKind);
  }

  hide(): void {
    this.open = false;
    this.closeDropdowns();
    this.setVisible(false);
  }

  private tryRecruit(): void {
    if (!this.handlers.onRecruit || !this.recruitment) {
      return;
    }

    const loadout = this.selection[this.selectedKind];
    const denial = recruitmentDenial(this.recruitment, this.selectedKind, loadout);

    if (denial) {
      this.recruitNotice.setText(denialMessage(denial));
      return;
    }

    if (this.handlers.onRecruit(this.selectedKind, loadout)) {
      this.hide();
      return;
    }

    this.recruitNotice.setText('Brak wolnego heksu do rozmieszczenia');
  }

  private isAllowed(kind: UnitKind): boolean {
    return this.recruitment?.allowedKinds.includes(kind) ?? true;
  }

  private selectUnit(kind: UnitKind): void {
    if (this.selectedKind === kind || !this.isAllowed(kind)) {
      return;
    }

    this.selectedKind = kind;
    this.handlers.onSelectKind?.(kind);
    this.render();
  }

  private toggleDropdown(slotIndex: number): void {
    this.openDropdown = this.openDropdown === slotIndex ? null : slotIndex;
    this.renderDropdowns();
  }

  private closeDropdowns(): void {
    this.openDropdown = null;
    this.renderDropdowns();
  }

  private selectWeapon(slotIndex: number, optionIndex: number): void {
    const loadout = this.selection[this.selectedKind];
    const next: Loadout =
      slotIndex === 0
        ? { ...loadout, primary: (PRIMARY_WEAPONS[optionIndex] ?? PRIMARY_WEAPONS[0]).id }
        : {
            ...loadout,
            secondary: (SECONDARY_WEAPONS[optionIndex] ?? SECONDARY_WEAPONS[0]).id,
          };

    this.selection[this.selectedKind] = next;
    this.openDropdown = null;
    this.render();
  }

  private render(): void {
    this.renderRows();
    this.renderUnit();
    this.renderRecruitment();
    this.renderDropdowns();
  }

  private renderRows(): void {
    const rowCount = Math.ceil(this.rows.length / this.cardColumns);
    const totalHeight = rowCount * this.cardStepY - CARD_GAP;

    this.scrollMax = Math.max(0, totalHeight - this.listHeight);
    this.scrollY = Math.min(this.scrollY, this.scrollMax);

    this.rows.forEach((row, index) => {
      const cardColumn = index % this.cardColumns;
      const cardRow = Math.floor(index / this.cardColumns);
      const selected = row.kind === this.selectedKind;
      const remaining = this.recruitment
        ? remainingPurchases(this.recruitment, row.kind)
        : undefined;
      const available = this.isAllowed(row.kind) && !(remaining !== undefined && remaining <= 0);

      row.container.setPosition(
        this.listX + this.cardOffsetX + cardColumn * this.cardStepX,
        this.listY + cardRow * this.cardStepY - this.scrollY,
      );
      row.background.setFillStyle(selected ? this.theme.accentDark : 0x0f1114, selected ? 1 : 0.5);
      row.background.setStrokeStyle(
        1,
        selected ? this.theme.accentBright : this.theme.divider,
        1,
      );
      row.portrait.setAlpha(available ? 1 : 0.35);
      row.name.setColor(available ? (selected ? '#f2f5f7' : '#d8e2dc') : '#5a6a60');
      row.price.setText(this.rowPriceLabel(row.kind, remaining));
      row.price.setColor(available ? '#f2d35c' : '#7a6a3a');
    });

    const barHeight =
      this.scrollMax <= 0 ? 0 : Math.max(32, (this.listHeight * this.listHeight) / totalHeight);
    const barY =
      this.scrollMax <= 0
        ? this.listY
        : this.listY + (this.scrollY / this.scrollMax) * (this.listHeight - barHeight);

    this.scrollBar
      .setVisible(this.scrollMax > 0)
      .setPosition(this.listX + this.listWidth - 6, barY)
      .setSize(4, barHeight);
  }

  private onWheel(
    pointer: Phaser.Input.Pointer,
    _objects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (!this.open || this.scrollMax <= 0) {
      return;
    }

    if (
      pointer.x < this.listX ||
      pointer.x > this.listX + this.listWidth ||
      pointer.y < this.listY ||
      pointer.y > this.listY + this.listHeight
    ) {
      return;
    }

    this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.scrollMax);
    this.renderRows();
  }

  private rowPriceLabel(kind: UnitKind, remaining: number | undefined): string {
    if (!this.isAllowed(kind)) {
      return 'NIEDOSTĘPNE';
    }

    if (remaining !== undefined && remaining <= 0) {
      return 'WYCZERPANE';
    }

    const price = totalCost(kind, this.selection[kind]);

    return remaining === undefined ? `${price}` : `${price} · ×${remaining}`;
  }

  private renderRecruitment(): void {
    if (!this.recruitment) {
      return;
    }

    this.balanceText.setText(`KONTO ${this.recruitment.funds}`);

    const loadout = this.selection[this.selectedKind];
    const denial = recruitmentDenial(this.recruitment, this.selectedKind, loadout);
    const disabled = denial !== undefined;

    this.recruitButton
      .setFillStyle(disabled ? 0x2a2f33 : this.theme.accentDark, 1)
      .setStrokeStyle(1, disabled ? this.theme.divider : this.theme.accentBright, 0.8);
    this.recruitLabel
      .setText(`KUP JEDNOSTKĘ · ${totalCost(this.selectedKind, loadout)}`)
      .setColor(disabled ? '#7a848a' : '#ffffff');
    this.recruitNotice.setText(disabled ? denialMessage(denial) : '');
  }

  private renderUnit(): void {
    const stats = UNIT_DEFS[this.selectedKind];
    const ammo = stats.ammo !== undefined ? ` · POCISKI ${stats.ammo}/${stats.ammo}` : '';

    this.nameText.setText(`${stats.label} — ${FACTION_DEFS[this.faction].label}`);
    this.roleText.setText(UNIT_ROLES[this.selectedKind]);
    this.statsText.setText(
      [
        `HP ${stats.maxHp}/${stats.maxHp} · ATK ${stats.attack} · DEF ${stats.defense}${ammo}`,
        `Ruch ${formatPoints(stats.moveRange)} · Wzrok ${formatRange(stats.visionRange)} · Strzał ${formatRange(stats.attackRange)}`,
        `Cena ${totalCost(this.selectedKind, this.selection[this.selectedKind])}`,
      ].join('\n'),
    );
    this.renderPortrait();
  }

  private renderPortrait(): void {
    this.portraitImage
      .setTexture(loadoutPortraitKey(this.selection[this.selectedKind]))
      .setDisplaySize(this.portraitDisplaySize, this.portraitDisplaySize);
  }

  private renderDropdowns(): void {
    const loadout = this.selection[this.selectedKind];

    this.dropdowns.forEach((dropdown) => {
      const isPrimary = dropdown.slotIndex === 0;
      const selectedId = isPrimary ? loadout.primary : loadout.secondary;
      const options = isPrimary ? PRIMARY_WEAPONS : SECONDARY_WEAPONS;
      const selectedIndex = options.findIndex((option) => option.id === selectedId);
      const open = this.openDropdown === dropdown.slotIndex;

      dropdown.value.setText(options[selectedIndex]?.label ?? options[0].label);
      dropdown.field
        .setStrokeStyle(1, open ? this.theme.accentBright : this.theme.divider, 1)
        .setFillStyle(open ? this.theme.accent : this.theme.accentDark, 0.9);
      dropdown.popup.setVisible(open);
      dropdown.options.forEach((text, optionIndex) => {
        text.setVisible(open).setColor(optionIndex === selectedIndex ? '#ffffff' : '#9fb0a5');
      });
    });
  }

  private applyTheme(theme: FactionTheme): void {
    this.theme = theme;
    this.panel.setFillStyle(theme.barBackground, 0.98).setStrokeStyle(1, theme.accent, 1);
    this.accent.setFillStyle(theme.accent, 1);
    this.title.setColor(theme.accentSoft);
    this.portraitFrame.setStrokeStyle(1, theme.divider, 1);
    this.equipmentTitle.setColor(theme.accentSoft);
    this.recruitButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.closeButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.renderDropdowns();
  }

  private setVisible(visible: boolean): void {
    for (const object of this.objects) {
      object.setVisible(visible);
    }
  }

  private register<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible>(
    object: T,
  ): T {
    this.objects.push(object);

    return object;
  }
}
