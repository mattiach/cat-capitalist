import { BUSINESSES } from '../../logic/data/businesses.ts';
import { UPGRADES } from '../../logic/data/upgrades.ts';
import { PERMANENT_UPGRADES } from '../../logic/data/permanentUpgrades.ts';
import type { IconName } from '../../logic/data/iconNames.ts';
import { buyUpgrade } from '../../logic/economy.ts';
import { fmt } from '../../logic/format.ts';
import { hex } from '../art/color.ts';
import { drawBusinessIcon } from '../art/businessIcon.ts';
import { C, CX, CY, PAGER_GAP, PAGER_X, PAGER_Y, RED, ROW_GAP, ROW_TOP, ROW_W, ROWS_PER_COLUMN } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import type { Button } from '../ui/Ui.ts';
import { permanentUpgradesList } from './permanentUpgrades.ts';

const PAGE_SIZE = ROWS_PER_COLUMN * 2;
const pageOf = (order: number) => Math.floor(order / PAGE_SIZE);

type Section = 'run' | 'forever';
/** Survives leaving the tab, so the player comes back to the list they were using. */
let section: Section = 'run';

/** The Fur Emporium: run upgrades (money, lost on ascending) and Forever upgrades (Golden Fish, kept) as two tabs. */
export function upgradesView(game: GameScene) {
  const { ui } = game;
  const foreverOpen = game.canVisitHeaven();
  if (!foreverOpen) section = 'run';
  // A NEW tag on the other tab says something just unlocked there.
  const newIn = (s: Section) => s === 'run' ? UPGRADES.some((_, k) => game.isNew(k)) : PERMANENT_UPGRADES.some((_, k) => game.isNew(`p${k}`));
  const countLabel = ui.title('The Fur Emporium', '');
  const tabs: [Section, string, IconName][] = [['run', 'This Run', 'coin'], ['forever', 'Forever', 'fish']];
  tabs.forEach(([id, label, icon], n) => {
    const x = CX + 345 + n * 138;
    const active = id === section;
    const locked = id === 'forever' && !foreverOpen;
    const button = ui.button(x, CY + 14, 130, 34, locked ? 'Forever' : label, active ? C.orange : C.cardLight, () => {
      if (locked) return ui.floatText(x, CY + 14, 'Opens with Cat Heaven', RED);
      if (active) return;
      section = id;
      game.sfx.play('tab');
      game.rebuild();
    }, 15, locked ? 'lock' : icon);
    if (!active && newIn(id)) ui.newTag(x + 52, CY - 2);
    if (locked) button.setColor(C.unavailable);
  });
  return section === 'forever' ? permanentUpgradesList(game, countLabel) : runUpgradesList(game, countLabel);
}

/** Every run upgrade not bought yet, cheapest first. One bought now stays listed until the tab is reopened. */
function runUpgradesList(game: GameScene, countLabel: Phaser.GameObjects.Text) {
  const { s, ui } = game;
  countLabel.setColor(hex(C.pink));
  const list = UPGRADES.map((u, k) => ({ ...u, k })).filter((u) => !s.upgrades[u.k]).sort((a, b) => a.cost - b.cost);
  if (!list.length) ui.iconText(CX + 524, 400, 'celebrate', 18, 'Every upgrade purchased!', 30, '#ffffff', true);
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  // Open on the first page holding something new, so it can't be missed.
  let page = pageOf(Math.max(0, list.findIndex((u) => game.isNew(u.k))));
  let rows: { k: number; cost: number; btn: Button; card: Phaser.GameObjects.Rectangle; newTag: ReturnType<typeof ui.newTag> }[] = [];
  const pageLayer = ui.own(game.add.container(0, 0));

  const drawPage = () => {
    pageLayer.removeAll(true);
    ui.within(pageLayer, () => {
      rows = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((u, n) => {
        const x = CX + (n < ROWS_PER_COLUMN ? 0 : ROW_W + 16);
        const y = ROW_TOP + (n % ROWS_PER_COLUMN) * ROW_GAP;
        const subtitle = u.target < 0 ? 'All profits x3' : `${BUSINESSES[u.target].name} profit x3`;
        const { card, icon, buttonX, buttonY } = ui.itemRow(x, y, (ix, iy, r) => drawBusinessIcon(game, ix, iy, r, u.target), u.name, subtitle);
        const btn = ui.button(buttonX, buttonY, 140, 36, fmt(u.cost), C.green, () => {
          if (!buyUpgrade(game.s, u.k)) return ui.floatText(buttonX, y, 'Not enough money!', RED);
          game.clearNew(u.k);
          ui.pop(icon);
          ui.burst(x + 40, buttonY, C.gold);
          ui.toast(`${u.name} purchased!`, 'upgrade', (ix, iy, size) => drawBusinessIcon(game, ix, iy, size, u.target));
          game.save();
        }, 15);
        return { k: u.k, cost: u.cost, btn, card, newTag: ui.newTag(x + 340, y + 18) };
      });
    });
  };

  const showPager = list.length ? ui.pager(PAGER_X, PAGER_Y, PAGER_GAP, (dir) => {
    page = Math.min(pageCount - 1, Math.max(0, page + dir));
    drawPage();
  }) : undefined;
  drawPage();

  return () => {
    countLabel.setText(`Money · lost when you ascend · ${game.s.upgrades.filter(Boolean).length}/${UPGRADES.length} bought`);
    const hasNew = (test: (itemPage: number) => boolean) => list.some((u, order) => test(pageOf(order)) && game.isNew(u.k));
    showPager?.(page, pageCount, hasNew((p) => p < page), hasNew((p) => p > page));
    rows.forEach(({ k, cost, btn, card, newTag }) => {
      const bought = game.s.upgrades[k];
      newTag.setVisible(game.isNew(k));
      if (bought) btn.setLabel('Purchased', 'check');
      else btn.setLabel(fmt(cost));
      btn.setDisabled(bought);
      btn.setColor(bought ? C.purchased : game.s.money >= cost ? C.green : C.unavailable);
      if (bought) card.setFillStyle(C.cardLight).setStrokeStyle(2, C.purchased);
    });
  };
}
