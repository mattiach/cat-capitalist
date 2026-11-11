import { BUSINESSES } from '../../logic/data/businesses.ts';
import { hire, managerCost } from '../../logic/economy.ts';
import { fmt } from '../../logic/format.ts';
import { drawBusinessIcon } from '../art/businessIcon.ts';
import { drawCat } from '../art/drawCat.ts';
import { C, CX, CY, MUTED, RED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { MANAGER_LOOKS, showManagerIntro } from '../ui/managerIntro.ts';

export function managersView(game: GameScene) {
  const { ui } = game;
  ui.title('Managers', 'Managers run a business on their own — even while you nap.');
  const buttons = BUSINESSES.map((biz, i) => {
    const x = CX + (i < 5 ? 0 : 532);
    const y = CY + 50 + (i % 5) * 110;
    ui.box(x, y, 516, 100);
    ui.own(drawCat(game, x + 52, y + 58, 30, MANAGER_LOOKS[i]));
    ui.own(game.add.circle(x + 84, y + 78, 15, C.dark).setStrokeStyle(1.5, C.cardLight));
    ui.own(drawBusinessIcon(game, x + 84, y + 78, 12, i));
    ui.txt(x + 110, y + 24, biz.manager, 19, '#ffffff', true);
    ui.txt(x + 110, y + 54, `Runs the ${biz.name}`, 14, MUTED);
    const btn = ui.button(x + 420, y + 50, 150, 40, '', C.green, () => {
      if (hire(game.s, i)) {
        game.clearNew(i);
        game.save();
        return showManagerIntro(game, i);
      }
      ui.floatText(x + 420, y + 20, game.s.biz[i].owned ? 'Not enough money!' : 'Unlock it first!', RED);
    }, 15);
    return { btn, newTag: ui.newTag(x + 26, y + 16) };
  });

  return () => buttons.forEach(({ btn, newTag }, i) => {
    newTag.setVisible(game.isNew(i));
    const hired = game.s.biz[i].manager;
    const price = managerCost(game.s, i);
    const unlocked = game.s.biz[i].owned > 0;
    if (hired) btn.setLabel('Hired', 'check');
    else btn.setLabel(unlocked ? fmt(price) : 'Unlock business first');
    btn.setDisabled(hired || !unlocked);
    btn.setColor(hired ? C.purchased : !unlocked ? C.unavailable : game.s.money >= price ? C.green : C.grey);
  });
}
