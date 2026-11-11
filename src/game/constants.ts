import type Phaser from 'phaser';

/** Logical 16:9 layout shown by the camera; the canvas matches the window in physical pixels. */
export const VIEW_W = 1280;
export const VIEW_H = 720;
/** Text texture density for the current camera zoom: enough to stay sharp, capped to limit memory. */
export const textRes = (scene: Phaser.Scene) => Math.min(4, Math.max(2, Math.ceil(scene.cameras.main.zoom)));
/** Top-left of the content area (right of the sidebar, below the header): 1048 x 600. */
export const CX = 216;
export const CY = 108;
/** Every paginated page shares these: list rows and the pager below them. */
export const ROW_TOP = CY + 42;
export const ROW_W = 516;
export const ROW_H = 72;
export const ROW_GAP = 82;
export const ROWS_PER_COLUMN = 6;
export const PAGER_X = CX + 524;
export const PAGER_Y = CY + 558;
export const PAGER_GAP = 84;

export const FONT = 'Fredoka, "Trebuchet MS", "Segoe UI", sans-serif';
export const C = {
  bg: 0x21152f, side: 0x191020, header: 0x251834, card: 0x39274e, cardLight: 0x50386b, dark: 0x21162d,
  orange: 0xffad55, green: 0x32c982, pink: 0xff78a8, grey: 0x655575, gold: 0xffcf5a,
  purchased: 0x7957a5, unavailable: 0x382b47, diamond: 0x5ce1ff,
};
export const MUTED = '#c9b8e0';
export const GOLD = '#ffd166';
export const RED = '#ff6b6b';

export const BUY_MODES = [1, 10, 100, 'MAX'] as const;
