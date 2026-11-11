import { buyPermanentUpgrade, permanentUpgradeLock } from '../../logic/economy.ts';
import { PERMANENT_UPGRADES } from '../../logic/data/permanentUpgrades.ts';
import { C, CX, GOLD, PAGER_GAP, PAGER_X, PAGER_Y, RED, ROW_GAP, ROW_TOP, ROW_W, ROWS_PER_COLUMN } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import type { Button } from '../ui/Ui.ts';

const PAGE_SIZE = ROWS_PER_COLUMN * 2;
/** Cheapest first, so the list reads as the road to the late game; saves keep each upgrade's position in PERMANENT_UPGRADES. */
const ORDER = PERMANENT_UPGRADES.map((_, k) => k).sort((a, b) => PERMANENT_UPGRADES[a].cost - PERMANENT_UPGRADES[b].cost);
const PAGE_COUNT = Math.ceil(ORDER.length / PAGE_SIZE);
const pageOf = (order: number) => Math.floor(order / PAGE_SIZE);

/** The Forever tab of the Fur Emporium: Golden Fish upgrades kept through every ascension. NEW tags use `p<index>`. */
export function permanentUpgradesList(game: GameScene, countLabel: Phaser.GameObjects.Text) {
  const { ui } = game;
  countLabel.setColor(GOLD);
  // Open on the first page holding something new, so it can't be missed.
  let page = pageOf(Math.max(0, ORDER.findIndex((k) => game.isNew(`p${k}`))));
  let cards: { i: number; card: Phaser.GameObjects.Rectangle; btn: Button; requirement: Phaser.GameObjects.Text; newTag: ReturnType<typeof ui.newTag> }[] = [];
  const pageLayer = ui.own(game.add.container(0, 0));

  const drawPage = () => {
    pageLayer.removeAll(true);
    ui.within(pageLayer, () => {
      cards = ORDER.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((i, n) => {
        const upgrade = PERMANENT_UPGRADES[i];
        const x = CX + (n < ROWS_PER_COLUMN ? 0 : ROW_W + 16);
        const y = ROW_TOP + (n % ROWS_PER_COLUMN) * ROW_GAP;
        const { card, note, buttonX, buttonY } = ui.itemRow(x, y, upgrade.icon, upgrade.name, upgrade.description, true);
        const btn = ui.button(buttonX, buttonY, 140, 36, '', C.green, () => {
          if (!buyPermanentUpgrade(game.s, i)) return ui.floatText(buttonX, y, 'Need more Golden Fish!', RED);
          game.clearNew(`p${i}`);
          game.save();
          ui.toast(`${upgrade.name} unlocked permanently!`, 'upgrade', upgrade.icon, 'permanent');
        }, 15);
        return { i, card, btn, requirement: note, newTag: ui.newTag(x + 340, y + 18) };
      });
    });
  };

  const showPager = ui.pager(PAGER_X, PAGER_Y, PAGER_GAP, (dir) => {
    page = Math.min(PAGE_COUNT - 1, Math.max(0, page + dir));
    drawPage();
  });
  drawPage();

  return () => {
    countLabel.setText(`Golden Fish · kept when you ascend · ${game.s.permanentUpgrades.filter(Boolean).length}/${PERMANENT_UPGRADES.length} owned`);
    const hasNew = (test: (itemPage: number) => boolean) => ORDER.some((k, order) => test(pageOf(order)) && game.isNew(`p${k}`));
    showPager(page, PAGE_COUNT, hasNew((p) => p < page), hasNew((p) => p > page));
    cards.forEach(({ i, card, btn, requirement, newTag }) => {
      const purchased = game.s.permanentUpgrades[i];
      const lock = purchased ? undefined : permanentUpgradeLock(game.s, i);
      requirement.setText(lock ?? '');
      requirement.setScale(Math.min(1, 270 / Math.max(1, requirement.width)));
      newTag.setVisible(game.isNew(`p${i}`));
      if (purchased) btn.setLabel('Unlocked', 'check');
      else if (lock) btn.setLabel('Locked', 'lock');
      else btn.setLabel(String(PERMANENT_UPGRADES[i].cost), 'fish');
      btn.setDisabled(purchased || lock !== undefined);
      btn.setColor(purchased ? C.purchased : !lock && game.s.fish >= PERMANENT_UPGRADES[i].cost ? C.green : C.unavailable);
      if (purchased) card.setFillStyle(C.cardLight).setStrokeStyle(2, C.purchased);
    });
  };
}
