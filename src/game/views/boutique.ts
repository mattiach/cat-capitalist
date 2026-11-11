import { ACCESSORY_BONUS, accessoryCost, buyAccessory, canAffordAccessory } from '../../logic/collection.ts';
import { ACCESSORIES, isPremiumAccessory, SLOT_LABELS, type Slot } from '../../logic/data/accessories.ts';
import { fmt, pct } from '../../logic/format.ts';
import { hex } from '../art/color.ts';
import { drawCat } from '../art/drawCat.ts';
import { C, CX, CY, PAGER_GAP, PAGER_X, PAGER_Y, RED, ROW_TOP } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { revealCat } from '../ui/catReveal.ts';
import type { Button } from '../ui/Ui.ts';

const PAGE_SIZE = 12;
type Filter = 'all' | Slot | 'diamonds' | 'special';
const FILTERS: { id: Filter; label: string; w: number }[] = [
  { id: 'all', label: 'All', w: 58 },
  { id: 'head', label: 'Hats', w: 66 },
  { id: 'face', label: 'Glasses', w: 88 },
  { id: 'neck', label: 'Accessories', w: 118 },
  { id: 'diamonds', label: 'Diamonds', w: 110 },
  { id: 'special', label: 'Specials', w: 104 },
];
const matches = (k: number, filter: Filter) =>
  // Specials live in their own tab only, so the regular catalog reads as what completion needs.
  ACCESSORIES[k].special ? filter === 'special'
    : filter === 'all' || (filter === 'diamonds' ? ACCESSORIES[k].diamondCost !== undefined : filter !== 'special' && ACCESSORIES[k].slot === filter);
const EFFECT_NAMES = { sparkle: 'sparkles', fire: 'flames', rainbow: 'rainbow' };

/** Filter choice survives leaving the tab, so shopping for one category stays in that category. */
let filter: Filter = 'all';

export function boutiqueView(game: GameScene) {
  const { ui } = game;
  const hint = ui.title('Boutique', '');
  // Cheapest first, with the Diamond collection closing the catalog.
  const sortValue = (k: number) => (ACCESSORIES[k].diamondCost ? Infinity : ACCESSORIES[k].cost);
  const sorted = ACCESSORIES.map((_, i) => i).filter((k) => !ACCESSORIES[k].retired).sort((a, b) => sortValue(a) - sortValue(b) || (ACCESSORIES[a].diamondCost ?? 0) - (ACCESSORIES[b].diamondCost ?? 0));
  let catalog = sorted.filter((k) => matches(k, filter));
  const pageCount = () => Math.max(1, Math.ceil(catalog.length / PAGE_SIZE));
  const pageOf = (order: number) => Math.floor(order / PAGE_SIZE);
  // Open on the first page holding something new, so it can't be missed.
  let page = pageOf(Math.max(0, catalog.findIndex((k) => game.isNew(k))));
  const pageLayer = ui.own(game.add.container(0, 0));
  let buttons: { button: Button; index: number; newTag: ReturnType<typeof ui.newTag> }[] = [];

  const drawPage = () => {
    pageLayer.removeAll(true);
    ui.within(pageLayer, () => {
      buttons = catalog.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((k, cardIndex) => {
        const a = ACCESSORIES[k];
        const x = CX + (cardIndex % 4) * 264;
        const y = ROW_TOP + Math.floor(cardIndex / 4) * 164;
        ui.rect(x + 128, y + 81, 256, 154, 0x000000, 14, 0.28);
        const card = ui.rect(x + 128, y + 77, 256, 154, C.cardLight, 14);
        const special = Boolean(a.reward || a.effect);
        const tribute = a.special === true;
        const premium = !tribute && isPremiumAccessory(a);
        const accent = tribute ? C.pink : premium ? C.diamond : special ? C.gold : C.orange;
        card.setStrokeStyle(premium || tribute ? 3 : special ? 2 : 1, tribute ? C.pink : premium ? C.diamond : special ? C.gold : 0xffffff, premium || tribute ? 1 : special ? 0.8 : 0.2);
        ui.rect(x + 38, y + 40, 62, 62, C.card, 31).setStrokeStyle(2, accent, special ? 0.8 : 0.5);
        // Glasses are shown on a white cat: dark frames would vanish on the badge, and this shows how they sit.
        const icon = (a.slot === 'face' ? ui.own(drawCat(game, x + 38, y + 42, 23, { breed: 1, coat: 2, head: -1, face: k, neck: -1 })) : ui.icon(x + 38, y + 40, 24, a.icon))
          .setSize(56, 56).setInteractive({ useHandCursor: true });
        icon.on('pointerover', () => icon.setScale(1.14));
        icon.on('pointerout', () => icon.setScale(1));
        ui.txt(x + 74, y + 13, a.name, 17, '#ffffff', true).setOrigin(0, 0);
        ui.txt(x + 74, y + 38, tribute ? `${SLOT_LABELS[a.slot]} · Special` : SLOT_LABELS[a.slot], 12, tribute ? hex(C.pink) : premium ? hex(C.diamond) : special ? '#ffe08a' : '#e3d5f3').setOrigin(0, 0);
        const bonusText = `+${pct(a.bonus ?? ACCESSORY_BONUS)} all profits`;
        const rewardText = a.diamondCost ? `${bonusText} · ${EFFECT_NAMES[a.effect!]}`
          : a.reward?.kind === 'diamond' ? `+${a.reward.amount} Diamond, once`
            : a.reward?.kind === 'money' ? `+${fmt(a.reward.amount!)}`
              : a.reward?.kind === 'fish' ? `+${a.reward.amount} Golden Fish`
                : a.reward?.kind === 'boost' ? `+${a.reward.amount}s income boost`
                  : a.reward?.kind === 'cat' ? 'Adds a random cat if new types remain'
                    : a.effect ? `Occasional ${EFFECT_NAMES[a.effect]}`
                      : bonusText;
        ui.txt(x + 128, y + 76, rewardText, 13, '#f3e8ff').setWordWrapWidth(226).setAlign('center').setOrigin(0.5, 0);
        const button = ui.button(x + 128, y + 132, 210, 30, '', C.green, () => {
          if (game.s.accessories[k]) return;
          const purchase = buyAccessory(game.s, k);
          if (!purchase) return ui.floatText(x + 128, y + 120, a.diamondCost ? 'Not enough Diamonds!' : 'Not enough money!', RED);
          game.clearNew(k);
          ui.pop(icon);
          ui.burst(x + 128, y + 48, C.pink);
          const reward = a.reward?.kind === 'money' ? ` +${fmt(a.reward.amount!)} cash`
            : a.reward?.kind === 'fish' ? ` +${a.reward.amount} Fish`
              : a.reward?.kind === 'boost' ? ` +${a.reward.amount}s boost`
                : a.reward?.kind === 'cat' ? purchase.gift ? '' : ' · collection already complete'
                  : a.effect ? ` · ${rewardText}` : '';
          if (a.reward?.kind === 'diamond') ui.toast(`${a.name}: +${a.reward.amount} Diamond!`, 'diamond');
          else if (a.diamondCost) ui.toast(`${a.name} is yours! ${rewardText}`, 'rare', a.icon);
          else ui.toast(`${a.name} unlocked!${reward}`, a.reward?.kind === 'money' || a.reward?.kind === 'fish' ? 'currency' : 'upgrade', a.icon);
          game.sidebar.drawFavorite();
          game.save();
          if (purchase.gift) revealCat(game, purchase.gift.cat, purchase.gift.reward);
        }, 14);
        return { button, index: k, newTag: ui.newTag(x + 226, y + 46) };
      });
    });
  };

  const showPager = ui.pager(PAGER_X, PAGER_Y, PAGER_GAP, (dir) => {
    page = Math.min(pageCount() - 1, Math.max(0, page + dir));
    drawPage();
    refresh();
  });

  let filterX = CX + 148;
  const filterButtons = FILTERS.map(({ id, label, w }) => {
    const button = ui.button(filterX + w / 2, CY + 14, w, 28, label, C.cardLight, () => {
      filter = id;
      catalog = sorted.filter((k) => matches(k, filter));
      page = 0;
      drawPage();
      refresh();
    }, 13, id === 'diamonds' ? 'diamond' : id === 'special' ? 'star' : undefined);
    filterX += w + 6;
    return { id, button };
  });

  const refresh = () => {
    hint.setText(filter === 'special' ? 'Fan tributes · just for fun, not needed to win' : 'Equip what you buy in the Cat Lounge.');
    filterButtons.forEach(({ id, button }) => button.setColor(id === filter ? C.orange : C.cardLight));
    buttons.forEach(({ button: btn, index, newTag }) => {
      const owned = game.s.accessories[index];
      newTag.setVisible(game.isNew(index));
      const { diamondCost } = ACCESSORIES[index];
      if (owned) btn.setLabel('Owned', 'check');
      else if (diamondCost) btn.setLabel(String(diamondCost), 'diamond');
      else btn.setLabel(fmt(accessoryCost(game.s, index)));
      btn.setDisabled(owned);
      btn.setColor(owned ? C.purchased : canAffordAccessory(game.s, index) ? C.green : C.unavailable);
    });
    const newOnPage = (test: (itemPage: number) => boolean) => catalog.some((k, order) => test(pageOf(order)) && game.isNew(k));
    showPager(page, pageCount(), newOnPage((p) => p < page), newOnPage((p) => p > page));
  };
  drawPage();
  refresh();
  return refresh;
}
