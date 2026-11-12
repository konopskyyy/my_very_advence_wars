import Phaser from 'phaser';
import {
  FACTION_DEFS,
  UNIT_DEFS,
  UNIT_KINDS,
  type FactionId,
  type UnitKind,
} from '../core/units';
import {
  recruitmentDenial,
  remainingPurchases,
  unitCost,
  type RecruitmentDenial,
  type RecruitmentState,
} from '../core/recruitment';
import { FACTION_THEMES, type FactionTheme } from './factionTheme';
import { formatPoints, formatRange } from './format';
import { drawInfantryPortrait } from './recruitPortrait';
import { unitTexture } from './unitLayer';

const PANEL_WIDTH = 780;
const PANEL_HEIGHT = 480;
const DEPTH = 40;
const LIST_WIDTH = 220;
const LIST_HEIGHT = 360;
const ROW_HEIGHT = 68;
const ROW_STEP = 76;

interface EquipmentOption {
  readonly label: string;
  readonly color: number;
}

interface EquipmentSlot {
  readonly label: string;
  readonly options: readonly EquipmentOption[];
}

interface UnitRow {
  readonly kind: UnitKind;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly icon: Phaser.GameObjects.Image;
  readonly name: Phaser.GameObjects.Text;
  readonly role: Phaser.GameObjects.Text;
  readonly price: Phaser.GameObjects.Text;
}

interface LoadoutChip {
  readonly background: Phaser.GameObjects.Rectangle;
  readonly text: Phaser.GameObjects.Text;
}

interface LoadoutRow {
  readonly kind: UnitKind;
  readonly slotIndex: number;
  readonly label: Phaser.GameObjects.Text;
  readonly chips: readonly LoadoutChip[];
}

const UNIT_ROLES: Record<UnitKind, string> = {
  infantry: 'ŻOŁNIERZ · piechota liniowa',
  tank: 'POJAZD · czołg',
  artillery: 'POJAZD · artyleria',
  scout: 'POJAZD · zwiadowca',
};

export interface RecruitDialogHandlers {
  readonly onRecruit?: (kind: UnitKind) => boolean;
  readonly onSelectKind?: (kind: UnitKind) => void;
}

const LOADOUTS: Record<UnitKind, readonly EquipmentSlot[]> = {
  infantry: [
    {
      label: 'Kask',
      options: [
        { label: 'Standard', color: 0x4a86e8 },
        { label: 'Stalowy', color: 0x9aa0a6 },
        { label: 'Zwiad', color: 0x3f6b4a },
      ],
    },
    {
      label: 'Mundur',
      options: [
        { label: 'Polowy', color: 0x3f6b4a },
        { label: 'Miejski', color: 0x4a5568 },
        { label: 'Pustynny', color: 0x8a7445 },
      ],
    },
    {
      label: 'Broń',
      options: [
        { label: 'Karabin', color: 0x2b2f33 },
        { label: 'Strzelba', color: 0x5a3a22 },
        { label: 'Snajper', color: 0x1f3a2a },
      ],
    },
    {
      label: 'Plecak',
      options: [
        { label: 'Standard', color: 0x5a4632 },
        { label: 'Medyczny', color: 0x8a2f2f },
        { label: 'Zwiad', color: 0x2f4f6b },
      ],
    },
  ],
  tank: [
    {
      label: 'Pancerz',
      options: [
        { label: 'Stal', color: 0x5a6570 },
        { label: 'Reaktywny', color: 0x3f4f5f },
        { label: 'Ciężki', color: 0x2b3540 },
      ],
    },
    {
      label: 'Wieża',
      options: [
        { label: 'Standard', color: 0x4a5568 },
        { label: 'Szybka', color: 0x6b7a8a },
        { label: 'Ciężka', color: 0x2f3a45 },
      ],
    },
    {
      label: 'Działo',
      options: [
        { label: '75 mm', color: 0x2b2f33 },
        { label: '105 mm', color: 0x3a2f25 },
        { label: '120 mm', color: 0x1f2a33 },
      ],
    },
    {
      label: 'Gąsienice',
      options: [
        { label: 'Szerokie', color: 0x2b2f33 },
        { label: 'Wąskie', color: 0x4a4f55 },
        { label: 'Teren', color: 0x3f4a2f },
      ],
    },
  ],
  artillery: [
    {
      label: 'Lufa',
      options: [
        { label: 'Standard', color: 0x2b2f33 },
        { label: 'Długa', color: 0x3a3f45 },
        { label: 'Ciężka', color: 0x1f2429 },
      ],
    },
    {
      label: 'Podstawa',
      options: [
        { label: 'Stal', color: 0x4a5568 },
        { label: 'Lekka', color: 0x6b7a8a },
        { label: 'Ciężka', color: 0x2f3a45 },
      ],
    },
    {
      label: 'Amunicja',
      options: [
        { label: 'Odłamek', color: 0x8a7445 },
        { label: 'Przeciw', color: 0x4a2f1f },
        { label: 'Dymna', color: 0x4a5568 },
      ],
    },
    {
      label: 'Celownik',
      options: [
        { label: 'Optyka', color: 0x2f4f6b },
        { label: 'Standard', color: 0x3f4a2f },
        { label: 'Precyzja', color: 0x1f3a2a },
      ],
    },
  ],
  scout: [
    {
      label: 'Silnik',
      options: [
        { label: 'Standard', color: 0x4a5568 },
        { label: 'Szybki', color: 0x6b7a8a },
        { label: 'Teren', color: 0x3f4a2f },
      ],
    },
    {
      label: 'Opancerzenie',
      options: [
        { label: 'Lekkie', color: 0x6b7a8a },
        { label: 'Standard', color: 0x4a5568 },
        { label: 'Ciężkie', color: 0x2f3a45 },
      ],
    },
    {
      label: 'Karabin',
      options: [
        { label: 'Lekki', color: 0x2b2f33 },
        { label: 'Maszyn', color: 0x3a2f25 },
        { label: 'Snajper', color: 0x1f3a2a },
      ],
    },
    {
      label: 'Wyposażenie',
      options: [
        { label: 'Radio', color: 0x2f4f6b },
        { label: 'Apteczka', color: 0x8a2f2f },
        { label: 'Lornetka', color: 0x5a4632 },
      ],
    },
  ],
};

function selectedColor(slots: readonly EquipmentSlot[], selection: readonly number[], index: number): number {
  const slot = slots[index];
  const option = slot?.options[selection[index] ?? 0];

  return option?.color ?? 0xffffff;
}

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
  private readonly loadoutRows: LoadoutRow[] = [];
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly accent: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly portraitFrame: Phaser.GameObjects.Rectangle;
  private readonly portraitGraphics: Phaser.GameObjects.Graphics;
  private readonly portraitImage: Phaser.GameObjects.Image;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly roleText: Phaser.GameObjects.Text;
  private readonly statsText: Phaser.GameObjects.Text;
  private readonly equipmentTitle: Phaser.GameObjects.Text;
  private readonly recruitButton: Phaser.GameObjects.Rectangle;
  private readonly recruitLabel: Phaser.GameObjects.Text;
  private readonly recruitNotice: Phaser.GameObjects.Text;
  private readonly balanceText: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Rectangle;
  private readonly selection: Record<UnitKind, number[]> = {
    infantry: [0, 0, 0, 0],
    tank: [0, 0, 0, 0],
    artillery: [0, 0, 0, 0],
    scout: [0, 0, 0, 0],
  };
  private theme: FactionTheme = FACTION_THEMES.blue;
  private faction: FactionId = 'blue';
  private selectedKind: UnitKind = 'infantry';
  private recruitment: RecruitmentState | null = null;
  private open = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: RecruitDialogHandlers = {},
  ) {
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;
    const panelX = centerX - PANEL_WIDTH / 2;
    const panelY = centerY - PANEL_HEIGHT / 2;
    const listX = panelX + 20;
    const listY = panelY + 70;
    const infoX = panelX + 500;
    const portraitX = panelX + 280;
    const portraitY = panelY + 70;
    const portraitWidth = 200;
    const portraitHeight = 300;

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
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, this.theme.barBackground, 0.98)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setStrokeStyle(1, this.theme.accent, 1)
        .setInteractive(),
    );

    this.accent = this.register(
      scene.add
        .rectangle(panelX + 20, panelY + 46, PANEL_WIDTH - 40, 2, this.theme.accent, 1)
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
        .text(panelX + PANEL_WIDTH - 20, panelY + 18, '', {
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
        .rectangle(listX, listY, LIST_WIDTH, LIST_HEIGHT, 0x05080c, 0.7)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setStrokeStyle(1, this.theme.divider, 1),
    );

    UNIT_KINDS.forEach((kind, index) => {
      const top = listY + 10 + index * ROW_STEP;
      const background = this.register(
        scene.add
          .rectangle(listX, top, LIST_WIDTH, ROW_HEIGHT, 0x0f1114, 0.5)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH + 2)
          .setStrokeStyle(1, this.theme.divider, 1)
          .setInteractive({ useHandCursor: true }),
      );
      const icon = this.register(
        scene.add
          .image(listX + 34, top + ROW_HEIGHT / 2, unitTexture(scene, kind, 'blue').key)
          .setScale(1.15)
          .setScrollFactor(0)
          .setDepth(DEPTH + 3),
      );
      const name = this.register(
        scene.add
          .text(listX + 62, top + 14, UNIT_DEFS[kind].label, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#d8e2dc',
          })
          .setScrollFactor(0)
          .setDepth(DEPTH + 3),
      );
      const role = this.register(
        scene.add
          .text(listX + 62, top + 38, UNIT_ROLES[kind], {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#6c7d72',
            wordWrap: { width: 146 },
          })
          .setScrollFactor(0)
          .setDepth(DEPTH + 3),
      );
      const price = this.register(
        scene.add
          .text(listX + LIST_WIDTH - 12, top + 12, '', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#f2d35c',
          })
          .setOrigin(1, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH + 3),
      );

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

      this.rows.push({ kind, background, icon, name, role, price });
    });

    this.portraitFrame = this.register(
      scene.add
        .rectangle(portraitX, portraitY, portraitWidth, portraitHeight, 0x05080c, 0.75)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setStrokeStyle(1, this.theme.divider, 1),
    );

    this.portraitGraphics = this.register(
      scene.add
        .graphics()
        // Obrys żołnierza ma środek sylwetki przesunięty względem (0, 0).
        .setPosition(portraitX + portraitWidth / 2 - 6, portraitY + portraitHeight / 2 - 51)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.portraitImage = this.register(
      scene.add
        .image(
          portraitX + portraitWidth / 2,
          portraitY + portraitHeight / 2,
          unitTexture(scene, 'infantry', 'blue').key,
        )
        .setScale(4.5)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2)
        .setVisible(false),
    );

    this.nameText = this.register(
      scene.add
        .text(infoX, panelY + 72, '', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.roleText = this.register(
      scene.add
        .text(infoX, panelY + 100, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.statsText = this.register(
      scene.add
        .text(infoX, panelY + 128, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#d8e2dc',
          wordWrap: { width: 270 },
          lineSpacing: 2,
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    this.equipmentTitle = this.register(
      scene.add
        .text(infoX, panelY + 176, 'WYPOSAŻENIE', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: this.theme.accentSoft,
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2),
    );

    const loadoutBaseY = panelY + 204;

    for (const kind of UNIT_KINDS) {
      LOADOUTS[kind].forEach((slot, slotIndex) => {
        const y = loadoutBaseY + slotIndex * 50;
        const label = this.register(
          scene.add
            .text(infoX, y + 4, slot.label, {
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#9fb0a5',
            })
            .setScrollFactor(0)
            .setDepth(DEPTH + 3),
        );
        const chips = slot.options.map((option, optionIndex) => {
          const x = infoX + 82 + optionIndex * 60;
          const background = this.register(
            scene.add
              .rectangle(x, y, 56, 22, this.theme.accentDark, 1)
              .setOrigin(0, 0)
              .setScrollFactor(0)
              .setDepth(DEPTH + 2)
              .setStrokeStyle(1, this.theme.divider, 1)
              .setInteractive({ useHandCursor: true }),
          );
          const text = this.register(
            scene.add
              .text(x + 28, y + 11, option.label, {
                fontFamily: 'monospace',
                fontSize: '9px',
                color: '#9fb0a5',
              })
              .setOrigin(0.5)
              .setScrollFactor(0)
              .setDepth(DEPTH + 3),
          );

          background.on('pointerdown', () =>
            this.selectOption(kind, slotIndex, optionIndex),
          );

          return { background, text };
        });

        this.loadoutRows.push({ kind, slotIndex, label, chips });
      });
    }

    const buttonY = panelY + PANEL_HEIGHT - 34;

    this.recruitNotice = this.register(
      scene.add
        .text(centerX, buttonY - 24, '', {
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
        .rectangle(centerX - 84, buttonY, 160, 32, this.theme.accentDark, 1)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    this.recruitLabel = this.register(
      scene.add
        .text(centerX - 84, buttonY, 'KUP JEDNOSTKĘ', {
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
        .rectangle(centerX + 84, buttonY, 140, 32, this.theme.accentDark, 1)
        .setScrollFactor(0)
        .setDepth(DEPTH + 2)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    this.register(
      scene.add
        .text(centerX + 84, buttonY, 'ZAMKNIJ', {
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
    this.selectedKind = recruitment.allowedKinds.includes(this.selectedKind)
      ? this.selectedKind
      : (recruitment.allowedKinds[0] ?? this.selectedKind);
    this.applyTheme(FACTION_THEMES[faction]);
    this.setVisible(true);
    this.render();
    this.handlers.onSelectKind?.(this.selectedKind);
  }

  hide(): void {
    this.open = false;
    this.setVisible(false);
  }

  private tryRecruit(): void {
    if (!this.handlers.onRecruit || !this.recruitment) {
      return;
    }

    const denial = recruitmentDenial(this.recruitment, this.selectedKind);

    if (denial) {
      this.recruitNotice.setText(denialMessage(denial));
      return;
    }

    if (this.handlers.onRecruit(this.selectedKind)) {
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

  private selectOption(kind: UnitKind, slotIndex: number, optionIndex: number): void {
    const selection = this.selection[kind];

    if (!selection || kind !== this.selectedKind) {
      return;
    }

    selection[slotIndex] = optionIndex;
    this.renderPortrait();
    this.renderLoadout();
  }

  private render(): void {
    this.renderRows();
    this.renderUnit();
    this.renderRecruitment();
  }

  private renderRows(): void {
    for (const row of this.rows) {
      const selected = row.kind === this.selectedKind;
      const remaining = this.recruitment
        ? remainingPurchases(this.recruitment, row.kind)
        : undefined;
      const available = this.isAllowed(row.kind) && !(remaining !== undefined && remaining <= 0);

      row.background.setFillStyle(selected ? this.theme.accentDark : 0x0f1114, selected ? 1 : 0.5);
      row.background.setStrokeStyle(
        1,
        selected ? this.theme.accentBright : this.theme.divider,
        1,
      );
      row.icon.setTexture(unitTexture(this.scene, row.kind, this.faction).key);
      row.icon.setAlpha(available ? 1 : 0.35);
      row.name.setColor(available ? (selected ? '#f2f5f7' : '#d8e2dc') : '#5a6a60');
      row.role.setColor(available ? (selected ? this.theme.accentSoft : '#6c7d72') : '#4a574f');
      row.price.setText(this.rowPriceLabel(row.kind, remaining));
      row.price.setColor(available ? '#f2d35c' : '#7a6a3a');
    }
  }

  private rowPriceLabel(kind: UnitKind, remaining: number | undefined): string {
    if (!this.isAllowed(kind)) {
      return 'NIEDOSTĘPNE';
    }

    if (remaining !== undefined && remaining <= 0) {
      return 'WYCZERPANE';
    }

    return remaining === undefined ? `${unitCost(kind)}` : `${unitCost(kind)} · ×${remaining}`;
  }

  private renderRecruitment(): void {
    if (!this.recruitment) {
      return;
    }

    this.balanceText.setText(`KONTO ${this.recruitment.funds}`);

    const denial = recruitmentDenial(this.recruitment, this.selectedKind);
    const disabled = denial !== undefined;

    this.recruitButton
      .setFillStyle(disabled ? 0x2a2f33 : this.theme.accentDark, 1)
      .setStrokeStyle(1, disabled ? this.theme.divider : this.theme.accentBright, 0.8);
    this.recruitLabel
      .setText(`KUP JEDNOSTKĘ · ${unitCost(this.selectedKind)}`)
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
        `Cena ${unitCost(this.selectedKind)}`,
      ].join('\n'),
    );
    this.renderPortrait();
    this.renderLoadout();
  }

  private renderPortrait(): void {
    const slots = LOADOUTS[this.selectedKind];
    const selection = this.selection[this.selectedKind] ?? [];

    if (this.selectedKind === 'infantry') {
      drawInfantryPortrait(this.portraitGraphics, {
        helmet: selectedColor(slots, selection, 0),
        uniform: selectedColor(slots, selection, 1),
        weapon: selectedColor(slots, selection, 2),
        pack: selectedColor(slots, selection, 3),
      });
      this.portraitGraphics.setVisible(true);
      this.portraitImage.setVisible(false);
      return;
    }

    this.portraitImage
      .setTexture(unitTexture(this.scene, this.selectedKind, this.faction).key)
      .setVisible(true);
    this.portraitGraphics.setVisible(false);
  }

  private renderLoadout(): void {
    const selection = this.selection[this.selectedKind] ?? [];

    for (const row of this.loadoutRows) {
      const visible = row.kind === this.selectedKind;
      const options = LOADOUTS[row.kind][row.slotIndex]?.options ?? [];

      row.label.setVisible(visible);

      row.chips.forEach((chip, optionIndex) => {
        chip.background.setVisible(visible);
        chip.text.setVisible(visible);

        if (!visible) {
          return;
        }

        const active = selection[row.slotIndex] === optionIndex;
        const color = options[optionIndex]?.color ?? this.theme.accentDark;

        chip.background
          .setFillStyle(active ? color : this.theme.accentDark, 1)
          .setStrokeStyle(1, active ? this.theme.accentBright : this.theme.divider, 1);
        chip.text.setColor(active ? '#ffffff' : '#9fb0a5');
      });
    }
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
