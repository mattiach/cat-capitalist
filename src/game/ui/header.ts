import { ZOOMIES_MULT, incomeRate } from '../../logic/economy.ts';
import { fmt, fmtCompact } from '../../logic/format.ts';
import { hex } from '../art/color.ts';
import type { IconName } from '../art/icons.ts';
import { BUY_MODES, C, GOLD, MUTED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

const CHIP_Y = 36;

/** Money, income and currency chips along the top. Returns the per-frame refresh. */
export function createHeader(game: GameScene) {
  const { ui } = game;
  ui.rect(740, 48, 1080, 96, C.header, 0);
  game.add.rectangle(740, 95, 1080, 2, C.cardLight, 0.55);
  const chip = (x: number, w: number, name: IconName, reserved = 0) => {
    const bg = ui.rect(x, CHIP_Y, w, 40, C.dark, 20);
    const icon = ui.icon(x, CHIP_Y, 11, name);
    const text = ui.txt(x, CHIP_Y, '', 15, '#ffffff', true).setOrigin(0, 0.5);
    /** Shows the full label, else the short one, and shrinks as a last resort so the text never leaves the chip. */
    const show = (full: string, short: string) => {
      const room = w - 40 - reserved;
      text.setText(full);
      if (text.width > room) text.setText(short);
      text.setScale(Math.min(1, room / text.width));
      const left = x - reserved / 2 - (text.displayWidth + 27) / 2;
      icon.setX(left + 11);
      text.setX(left + 27);
    };
    return { bg, show };
  };
  const money = ui.tabular(224, 6, 40, GOLD);
  const rate = ui.txt(226, 62, '', 15, MUTED);
  const fish = chip(624, 120, 'fish');
  const diamonds = chip(789, 190, 'diamond', 24);
  const angels = chip(989, 190, 'halo');

  // Starts shifted into the close button's spot; windowControls moves it back while that button shows.
  game.buyBox = game.add.container(54, 0);
  game.buyBox.add(game.add.rectangle(1095, 48, 1, 42, C.cardLight, 0.45));
  const buyMode = ui.within(game.buyBox, () => ui.button(1158, 36, 104, 40, '', C.orange, () => {
    game.buyMode = (game.buyMode + 1) % BUY_MODES.length;
    game.s.buyMode = game.buyMode;
    game.save();
    game.sfx.play('toggle');
  }).text);
  const zoomies = ui.txt(1264, 78, '', 15, hex(C.pink), true).setOrigin(1, 0.5);
  const zoomiesIcon = ui.icon(1264, 78, 9, 'bolt').setVisible(false);

  game.add.rectangle(552, 48, 1, 42, C.cardLight, 0.45);

  return () => {
    const s = game.s;
    const mode = BUY_MODES[game.buyMode];
    const count = fmtCompact;
    money.setText(fmt(s.money));
    rate.setText(`${fmt(incomeRate(s))} / sec from managers`);
    fish.show(count(s.fish), count(s.fish));
    diamonds.show(`${count(s.diamonds)} ${s.diamonds === 1 ? 'Diamond' : 'Diamonds'}`, count(s.diamonds));
    angels.show(`${count(s.angels)} ${s.angels === 1 ? 'Angel Cat' : 'Angel Cats'}`, count(s.angels));
    buyMode.setText(mode === 'MAX' ? 'Buy MAX' : `Buy x${mode}`);
    zoomies.setText(s.boost > 0 ? `ZOOMIES x${ZOOMIES_MULT} · ${Math.ceil(s.boost)}s left` : '');
    zoomiesIcon.setVisible(s.boost > 0).setX(1264 - zoomies.width - 13);
  };
}
