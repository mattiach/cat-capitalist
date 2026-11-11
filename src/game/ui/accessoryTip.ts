import { hex } from '../art/color.ts';
import { C, MUTED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { CAT_CARD, loungeRowY } from './sidebar.ts';

/**
 * Points at the two ways into the Cat Lounge and stays until the player goes there or dismisses it.
 * Sits under modals (depth 10) and doesn't block the sidebar. Returns the function that removes it.
 */
export function showAccessoryTip(game: GameScene, onDismiss: () => void) {
  const { ui } = game;
  const layer = game.add.container(0, 0).setDepth(9);
  const cardY = CAT_CARD.y + CAT_CARD.h / 2;
  const left = 216;
  const w = 390;
  const h = 170;
  const top = CAT_CARD.y + CAT_CARD.h - h;
  ui.within(layer, () => {
    const outlines = [
      ui.rect(100, loungeRowY(), 182, 35, C.pink, 12, 0),
      ui.rect(CAT_CARD.x + CAT_CARD.w / 2, cardY, CAT_CARD.w + 4, CAT_CARD.h + 4, C.pink, 16, 0),
    ].map((outline) => outline.setStrokeStyle(3, C.pink));
    game.tweens.add({ targets: outlines, alpha: 0.25, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    ui.own(game.add.triangle(0, 0, left - 22, cardY, left + 2, cardY - 16, left + 2, cardY + 16, C.pink).setOrigin(0));
    ui.rect(left + w / 2, top + h / 2 + 5, w, h, 0x000000, 16, 0.35);
    ui.rect(left + w / 2, top + h / 2, w, h, C.card, 16).setStrokeStyle(3, C.pink);
    ui.iconText(left + w / 2, top + 30, 'pinkBow', 14, 'Dress up your cat!', 22, hex(C.pink), true);
    ui.txt(left + w / 2, top + 76, 'You got your first accessory. Click your cat here on the left, or open Cat Lounge in the sidebar, to put it on.', 15, MUTED)
      .setOrigin(0.5).setAlign('center').setWordWrapWidth(w - 36);
    ui.button(left + w / 2, top + 134, 130, 38, 'Got it', C.pink, onDismiss, 16);
  });
  return () => {
    game.tweens.killTweensOf(layer.list);
    layer.destroy();
  };
}
