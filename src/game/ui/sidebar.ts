import Phaser from 'phaser';
import { ACCESSORIES } from '../../logic/data/accessories.ts';
import { RARITIES } from '../../logic/data/cats.ts';
import { UPGRADES } from '../../logic/data/upgrades.ts';
import { canAffordAccessory, catListing, catName, catRarity, findableCatCombos } from '../../logic/collection.ts';
import { angelsToClaim } from '../../logic/prestige.ts';
import { canVisitCatShop, catShopPrice } from '../../logic/catShop.ts';
import { managerCost, permanentUpgradeLock, superManagersOpen } from '../../logic/economy.ts';
import { DIAMOND_CATS } from '../../logic/data/diamonds.ts';
import { FISH_CATS } from '../../logic/data/cats.ts';
import { PERMANENT_UPGRADES } from '../../logic/data/permanentUpgrades.ts';
import { SUPER_MANAGERS } from '../../logic/data/superManagers.ts';
import { anyInvestmentReady, investorsOpen } from '../../logic/investors.ts';
import { hex } from '../art/color.ts';
import { idleCat } from '../art/idleCat.ts';
import { C, MUTED, VIEW_H } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { TABS, type Tab } from '../views/index.ts';

const NAV_TABS = TABS.filter((tab) => tab.id !== 'cheats');
/** Each of these starts a new group of rows, set apart by a gap and a thin line. */
const SECTION_STARTS = ['upgrades', 'cattery'].map((id) => NAV_TABS.findIndex((tab) => tab.id === id));
const SECTION_GAP = 14;
export const CAT_CARD = { x: 12, y: 494, w: 176, h: 214 };
/** Middle of the free space between the title and the cat card; the rows are centered on it. */
const NAV_MIDDLE = 286;
/** Row position; the list stays centered. */
const navY = (k: number) => {
  const rows = NAV_TABS.length;
  const row = k;
  const gaps = SECTION_STARTS.filter((start) => k >= start).length;
  return NAV_MIDDLE - ((rows - 1) * 31 + SECTION_STARTS.length * SECTION_GAP) / 2 + row * 31 + gaps * SECTION_GAP;
};
export const loungeRowY = () => navY(NAV_TABS.findIndex((tab) => tab.id === 'cattery'));

export type Sidebar = { refresh: () => void; drawFavorite: () => void };

/** Tab navigation with "something to do" badges, plus the favorite cat card. */
export function createSidebar(game: GameScene): Sidebar {
  const { ui } = game;
  game.add.rectangle(100, VIEW_H / 2, 200, VIEW_H, C.side);
  game.add.rectangle(199, VIEW_H / 2, 2, VIEW_H, C.cardLight, 0.6);
  ui.txt(100, 30, 'Cat Capitalist', 26, hex(C.orange), true).setOrigin(0.5);

  SECTION_STARTS.forEach((start) => game.add.rectangle(100, navY(start) - 15.5 - SECTION_GAP / 2, 160, 1, C.cardLight, 0.6));

  const nav = NAV_TABS.map(({ id, label, icon }, k) => {
    const y = navY(k);
    // Rows sit 31 px apart: 29 px tall leaves room for the hover border, which later rows would otherwise cover.
    const bg = ui.rect(100, y, 176, 29, C.side, 12).setInteractive({ useHandCursor: true });
    const tabIcon = ui.icon(34, y, 10, icon);
    const lockIcon = ui.icon(34, y, 10, 'lock').setVisible(false);
    const labelText = ui.txt(52, y, label, 15, '#ffffff', true).setOrigin(0, 0.5);
    bg.on('pointerdown', () => {
      if (id === 'heaven' && !game.canVisitHeaven()) return;
      if (id === 'catShop' && !canVisitCatShop(game.s)) return;
      if (id === 'superManagers' && !superManagersOpen(game.s)) return;
      if (id === 'investors' && !investorsOpen(game.s)) return;
      if ((id === 'boutique' || id === 'awards') && !game.hasManager()) return;
      game.sfx.play('tab');
      game.show(id);
    });
    bg.on('pointerover', () => bg.setStrokeStyle(2, C.orange));
    bg.on('pointerout', () => bg.setStrokeStyle());
    return { id, bg, label, labelText, tabIcon, lockIcon, badge: game.add.circle(178, y, 6, C.pink), locked: false };
  });

  ui.box(CAT_CARD.x, CAT_CARD.y, CAT_CARD.w, CAT_CARD.h).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
    game.selectedCat = game.s.favorite;
    game.sfx.play('tab');
    game.show('cattery');
  });
  ui.txt(100, 510, 'YOUR CAT', 13, MUTED, true).setOrigin(0.5);
  const name = ui.txt(100, 684, '', 15, '#ffffff', true).setOrigin(0.5).setAlign('center').setWordWrapWidth(160);
  let portrait: Phaser.GameObjects.Container | undefined;

  const drawFavorite = () => {
    const cat = game.s.cats[game.s.favorite] ?? game.s.cats[0];
    portrait?.destroy();
    const effects = ACCESSORIES.flatMap((item, i) => game.s.accessories[i] && item.effect ? [item.effect] : []);
    portrait = idleCat(game, 100, 610, 48, cat, effects);
    name.setText(catName(cat)).setColor(hex(RARITIES[catRarity(cat)].color));
  };
  drawFavorite();

  const refresh = () => {
    const s = game.s;
    const badges: Record<Tab, boolean> = {
      businesses: false,
      managers: s.biz.some((b, i) => !b.manager && b.owned > 0 && s.money >= managerCost(s, i)),
      superManagers: superManagersOpen(s) && SUPER_MANAGERS.some((m, i) => !s.superManagers[i] && s.biz[i].owned > 0 && s.money >= m.cost),
      investors: anyInvestmentReady(s, Date.now()),
      upgrades: UPGRADES.some((u, k) => !s.upgrades[k] && s.money >= u.cost) ||
        (game.canVisitHeaven() && PERMANENT_UPGRADES.some((u, k) => !s.permanentUpgrades[k] && s.fish >= u.cost && !permanentUpgradeLock(s, k))),
      cattery: [...DIAMOND_CATS, ...FISH_CATS].some((c) => s[catListing(c.breed, c.coat)!.currency] >= c.price && !s.cats.some((owned) => owned.breed === c.breed && owned.coat === c.coat)),
      catShop: canVisitCatShop(s) && s.money >= catShopPrice(s) && findableCatCombos(s).length > 0,
      boutique: ACCESSORIES.some((_, k) => !s.accessories[k] && canAffordAccessory(s, k)),
      music: false,
      awards: false,
      heaven: game.canVisitHeaven() && angelsToClaim(s) >= Math.max(10, s.angels),
      cheats: false,
      profile: false,
    };
    nav.forEach((item) => {
      const { id, bg, labelText, tabIcon, lockIcon, badge } = item;
      const locked = (id === 'heaven' && !game.canVisitHeaven()) || (id === 'catShop' && !canVisitCatShop(s)) || (id === 'superManagers' && !superManagersOpen(s)) || (id === 'investors' && !investorsOpen(s)) ||
        ((id === 'boutique' || id === 'awards') && !game.hasManager());
      if (locked !== item.locked) {
        if (locked) bg.disableInteractive();
        else bg.setInteractive({ useHandCursor: true });
        tabIcon.setVisible(!locked);
        lockIcon.setVisible(locked);
      }
      item.locked = locked;
      bg.setFillStyle(id === game.tab || (id === 'profile' && game.tab === 'cheats') ? C.orange : locked ? C.grey : C.side).setAlpha(locked ? 0.55 : 1);
      labelText.setAlpha(locked ? 0.55 : 1).setColor(id === game.tab || (id === 'profile' && game.tab === 'cheats') ? hex(C.dark) : '#ffffff');
      // Pink dot: something known you can act on.
      badge.setVisible(!locked && badges[id]);
    });
  };

  refresh();
  return { refresh, drawFavorite };
}
