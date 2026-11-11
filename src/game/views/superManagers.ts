import { BUSINESSES } from '../../logic/data/businesses.ts';
import { SUPER_MANAGERS, SUPER_MULT } from '../../logic/data/superManagers.ts';
import { hireSuper } from '../../logic/economy.ts';
import { fmt, superRewardText } from '../../logic/format.ts';
import { drawBusinessIcon } from '../art/businessIcon.ts';
import { drawCat } from '../art/drawCat.ts';
import { C, CX, CY, GOLD, MUTED, RED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { showSuperManagerIntro, SUPER_LOOKS } from '../ui/managerIntro.ts';

export function superManagersView(game: GameScene) {
  const { ui } = game;
  ui.title('Super Managers', `Each one makes a business earn x${SUPER_MULT}, forever. Ascending won't undo it.`);
  const buttons = SUPER_MANAGERS.map((hire, i) => {
    const x = CX + (i < 5 ? 0 : 532);
    const y = CY + 50 + (i % 5) * 110;
    ui.box(x, y, 516, 100);
    ui.own(drawCat(game, x + 52, y + 58, 30, SUPER_LOOKS[i]));
    ui.own(game.add.circle(x + 84, y + 78, 15, C.dark).setStrokeStyle(1.5, C.gold));
    ui.own(drawBusinessIcon(game, x + 84, y + 78, 12, i));
    ui.txt(x + 110, y + 14, hire.name, 19, GOLD, true);
    ui.txt(x + 110, y + 42, `${BUSINESSES[i].name} x${SUPER_MULT}`, 14, MUTED);
    ui.txt(x + 110, y + 64, `Bonus: ${superRewardText(hire.reward)}`, 14, '#ffffff');
    const btn = ui.button(x + 420, y + 50, 150, 40, '', C.green, () => {
      if (hireSuper(game.s, i)) {
        game.clearNew(i);
        game.save();
        return showSuperManagerIntro(game, i);
      }
      ui.floatText(x + 420, y + 20, game.s.biz[i].owned ? 'Not enough money!' : 'Unlock it first!', RED);
    }, 15);
    return { btn, newTag: ui.newTag(x + 26, y + 16) };
  });

  return () => buttons.forEach(({ btn, newTag }, i) => {
    newTag.setVisible(game.isNew(i));
    const hired = Boolean(game.s.superManagers[i]);
    const unlocked = game.s.biz[i].owned > 0;
    const price = SUPER_MANAGERS[i].cost;
    if (hired) btn.setLabel('Hired', 'check');
    else btn.setLabel(unlocked ? fmt(price) : 'Unlock business first');
    btn.setDisabled(hired || !unlocked);
    btn.setColor(hired ? C.purchased : !unlocked ? C.unavailable : game.s.money >= price ? C.green : C.grey);
  });
}
