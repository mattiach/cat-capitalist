import Phaser from 'phaser';
import { ACCESSORIES, SLOT_LABELS, SLOTS } from '../../logic/data/accessories.ts';
import { BREEDS, COATS, RARITIES } from '../../logic/data/cats.ts';
import { breedsFound, bestCatBonusPct, buyListedCat, catBonusPct, catListing, catName, catRarity, coatsFound, cycleAccessory, TOTAL_CAT_COMBINATIONS, undiscoveredCatCombos, type CatListing } from '../../logic/collection.ts';
import { fmt } from '../../logic/format.ts';
import type { Cat } from '../../logic/state.ts';
import { hex } from '../art/color.ts';
import { drawCat } from '../art/drawCat.ts';
import { C, CX, CY, GOLD, MUTED, RED, VIEW_W } from '../constants.ts';
import { revealCat } from '../ui/catReveal.ts';

import type { GameScene } from '../GameScene.ts';

const CAT_COUNT = TOTAL_CAT_COMBINATIONS;
const MYSTERY_CAT = { breed: 0, coat: 1, head: -1, face: -1, neck: -1 };

/** Confirmation for a listed cat, so a misclick can't spend Diamonds or Golden Fish. */
function confirmListedCat(game: GameScene, breed: number, coat: number, { price, currency }: CatListing) {
  const fish = currency === 'fish';
  const icon = fish ? 'fish' : 'diamond';
  const color = fish ? GOLD : hex(C.diamond);
  const { ui } = game;
  const preview: Cat = { breed, coat, head: -1, face: -1, neck: -1 };
  const rarity = RARITIES[catRarity(preview)];
  const cx = VIEW_W / 2;
  ui.openPanel(fish ? 'Golden Fish Cat' : 'Diamond Cat', 'This cat can be yours right now, no luck needed.', 480, () => {
    ui.own(drawCat(game, cx, 320, 60, preview));
    ui.txt(cx, 412, `${rarity.name.toUpperCase()} · ${catName(preview)}`, 25, hex(rarity.color), true).setOrigin(0.5);
    ui.txt(cx, 444, `This cat: +${catBonusPct(preview)} profit bonus`, 17, GOLD).setOrigin(0.5);
    ui.iconText(cx, 474, icon, 10, `Price: ${price}  ·  You have ${fmt(game.s[currency]).slice(1)}`, 17, color, true);
    ui.button(cx, 538, 260, 50, `Buy for ${price}`, game.s[currency] >= price ? C.green : C.grey, () => {
      const purchase = buyListedCat(game.s, breed, coat);
      if (!purchase) return ui.floatText(cx, 520, fish ? 'Not enough Golden Fish!' : 'Not enough Diamonds!', RED);
      game.save();
      revealCat(game, purchase.cat, purchase.reward);
      game.rebuild();
    }, 19, icon);
  });
}

export function catteryView(game: GameScene) {
  const { s, ui } = game;
  game.selectedCat = Phaser.Math.Clamp(game.selectedCat, 0, s.cats.length - 1);
  const cat = s.cats[game.selectedCat];
  const rarity = RARITIES[catRarity(cat)];
  const top = CY + 50;
  ui.title('Cat Lounge', 'Your highest cat bonus always applies, even when a lower-bonus cat is your favorite.');

  // selected cat, with accessory slots
  ui.box(CX, top, 400, 550);
  const catHalo = ui.own(game.add.circle(CX + 200, top + 140, 108, rarity.color, 0.12));
  const portraitHolder = ui.own(game.add.container(CX + 200, top + 140));
  let portrait = drawCat(game, 0, 0, 68, cat);
  portraitHolder.add(portrait);
  const catTitle = ui.txt(CX + 200, top + 256, catName(cat), 24, hex(rarity.color), true).setOrigin(0.5);
  const catDetails = ui.txt(CX + 200, top + 284, `${RARITIES[BREEDS[cat.breed].rarity].name} breed · ${RARITIES[COATS[cat.coat].rarity].name} coat`, 15, MUTED).setOrigin(0.5);
  const catProfit = ui.txt(CX + 200, top + 306, `This cat: +${catBonusPct(cat)} · Best: +${bestCatBonusPct(s)}`, 16, GOLD, true).setOrigin(0.5);
  const slotLabels: Phaser.GameObjects.Text[] = [];
  const slotButtons: ReturnType<typeof ui.button>[] = [];
  ui.own(game.add.rectangle(CX + 200, top + 330, 360, 1, 0xffffff, 0.15));
  ui.txt(CX + 20, top + 346, 'Outfit', 16, '#ffffff', true).setOrigin(0, 0.5);
  // One tap takes everything off this cat.
  const resetButton = ui.button(CX + 340, top + 346, 96, 24, 'Remove all', C.cardLight, () => {
    const selected = game.s.cats[game.selectedCat];
    for (const slot of SLOTS) selected[slot] = -1;
    game.save();
    game.sfx.play('equip');
    refreshSelectedCat();
    if (game.s.favorite === game.selectedCat) game.sidebar.drawFavorite();
  }, 11, 'close');
  SLOTS.forEach((slot, k) => {
    const y = top + 382 + k * 42;
    ui.txt(CX + 20, y, SLOT_LABELS[slot], 15, MUTED, true).setOrigin(0, 0.5);
    ui.rect(CX + 250, y, 200, 36, C.dark, 10);
    slotLabels.push(ui.txt(CX + 250, y, '', 14, '#ffffff', true).setOrigin(0.5));
    for (const dir of [-1, 1] as const) {
      const button = ui.button(CX + 250 + dir * 126, y, 40, 36, '', C.cardLight, () => {
        cycleAccessory(game.s, game.selectedCat, slot, dir);
        game.save();
        game.sfx.play('equip');
        refreshSelectedCat();
        if (game.s.favorite === game.selectedCat) game.sidebar.drawFavorite();
      }, 17, dir < 0 ? 'arrowLeft' : 'arrowRight');
      slotButtons.push(button);
    }
  });
  const favoriteButton = ui.button(CX + 200, top + 520, 260, 40, '', C.orange, () => {
    game.s.favorite = game.selectedCat;
    game.save();
    game.sfx.play('favorite');
    game.sidebar.drawFavorite();
    refreshSelectedCat();
  });

  // where cats come from
  const ax = CX + 416;
  ui.box(ax, top, 632, 150);
  ui.icon(ax + 32, top + 26, 13, 'house');
  ui.txt(ax + 52, top + 12, 'Finding Cats', 22, '#ffffff', true);
  ui.txt(ax + 612, top + 17, `Breeds ${breedsFound(s)}/${BREEDS.length} · Coats ${coatsFound(s)}/${COATS.length}`, 15, MUTED).setOrigin(1, 0);
  let ox = ax + 20;
  for (const r of RARITIES) ox += ui.txt(ox, top + 46, `${r.name} ${r.weight}%`, 14, hex(r.color), true).width + 14;
  ui.txt(ax + 20, top + 72, 'Buy mystery cats in the Cat Shop to fill the collection. Gold and blue cats are sold here for Golden Fish or Diamonds, which the Investors trade for.', 14, MUTED)
    .setWordWrapWidth(592);

  // collection grid
  ui.box(ax, top + 162, 632, 388);
  const discoveredCount = CAT_COUNT - undiscoveredCatCombos(s).length;
  ui.txt(ax + 20, top + 172, `Collection (${discoveredCount}/${CAT_COUNT})`, 18, '#ffffff', true);
  ui.txt(ax + 20, top + 193, 'Blue edge: Diamonds · Gold edge: Golden Fish · Dark: find it', 12, MUTED);
  const selectedCombo = s.cats[game.selectedCat];
  const selectedSlot = selectedCombo ? selectedCombo.breed * COATS.length + selectedCombo.coat : -1;
  let catPage = selectedSlot >= 0 ? Math.floor(selectedSlot / 28) : 0;
  const pageCount = Math.ceil(CAT_COUNT / 28);
  const showPager = ui.pager(ax + 470, top + 188, 84, (dir) => {
    catPage = Math.min(pageCount - 1, Math.max(0, catPage + dir));
    refreshSelectedCat();
  });
  const catCards = Array.from({ length: CAT_COUNT }, (_, slot) => {
    const breed = Math.floor(slot / COATS.length);
    const coat = slot % COATS.length;
    const index = s.cats.findIndex((owned) => owned.breed === breed && owned.coat === coat);
    const c = index >= 0 ? s.cats[index] : undefined;
    const listing = c ? undefined : catListing(breed, coat);
    const k = slot % 28;
    const cx = ax + 47 + (k % 7) * 89;
    const cy = top + 250 + Math.floor(k / 7) * 84;
    const isCurrentPage = Math.floor(slot / 28) === catPage;
    const card = ui.rect(cx, cy, 80, 76, C.dark, 12)
      .setVisible(isCurrentPage)
      .setStrokeStyle(c ? (index === game.selectedCat ? 4 : 2) : 1, c ? (index === game.selectedCat ? C.orange : RARITIES[catRarity(c)].color) : C.grey);
    if (listing) {
      card.setInteractive({ useHandCursor: true }).on('pointerdown', () => confirmListedCat(game, breed, coat, listing));
      if (!isCurrentPage) card.disableInteractive();
    }
    if (c) {
      card.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        game.clearNew(`${breed}:${coat}`);
        game.sfx.play('select');
        if (game.selectedCat === index) {
          refreshSelectedCat();
          return;
        }
        game.selectedCat = index;
        refreshSelectedCat();
      });
      if (!isCurrentPage) card.disableInteractive();
    }
    const icon = ui.own(drawCat(game, cx, listing ? cy - 2 : cy + 6, listing ? 18 : 21, c || listing ? { breed, coat, head: -1, face: -1, neck: -1 } : MYSTERY_CAT)).setAlpha(c ? 1 : listing ? 0.6 : 0.2);
    icon.setVisible(isCurrentPage);
    const priceTag = listing ? ui.iconText(cx, cy + 26, listing.currency === 'fish' ? 'fish' : 'diamond', 7, String(listing.price), 13, listing.currency === 'fish' ? GOLD : hex(C.diamond), true) : undefined;
    priceTag?.icon.setVisible(isCurrentPage);
    priceTag?.label.setVisible(isCurrentPage);
    const favoriteMark = ui.icon(cx + 28, cy - 26, 8, 'star').setVisible(isCurrentPage && c !== undefined && index === s.favorite);
    const newTag = c && game.isNew(`${breed}:${coat}`) ? ui.newTag(cx - 18, cy - 28) : undefined;
    return { slot, breed, coat, index, cat: c, listing, card, icon, priceTag, favoriteMark, newTag, visible: isCurrentPage };
  });

  function refreshSelectedCat() {
    const selected = game.s.cats[game.selectedCat];
    if (!selected) return;
    portrait.destroy();
    portrait = drawCat(game, 0, 0, 68, selected);
    portraitHolder.add(portrait);
    const selectedRarity = RARITIES[catRarity(selected)];
    catHalo.setFillStyle(selectedRarity.color, 0.12);
    catTitle.setText(catName(selected)).setColor(hex(selectedRarity.color));
    catDetails.setText(`${RARITIES[BREEDS[selected.breed].rarity].name} breed · ${RARITIES[COATS[selected.coat].rarity].name} coat`);
    catProfit.setText(`This cat: +${catBonusPct(selected)} · Best: +${bestCatBonusPct(game.s)}`);
    SLOTS.forEach((slot, k) => {
      const accessory = selected[slot];
      slotLabels[k].setText(accessory < 0 ? 'None' : ACCESSORIES[accessory].name);
      const hasOptions = s.accessories.some((owned, i) => owned && ACCESSORIES[i].slot === slot && !ACCESSORIES[i].retired);
      slotButtons[k * 2].setDisabled(!hasOptions);
      slotButtons[k * 2 + 1].setDisabled(!hasOptions);
      slotButtons[k * 2].setColor(hasOptions ? C.cardLight : C.unavailable);
      slotButtons[k * 2 + 1].setColor(hasOptions ? C.cardLight : C.unavailable);
    });
    const dressed = SLOTS.some((slot) => selected[slot] >= 0);
    resetButton.setVisible(dressed);
    resetButton.setDisabled(!dressed);
    const isFavorite = s.favorite === game.selectedCat;
    favoriteButton.setLabel(isFavorite ? 'Your Favorite' : 'Set as Favorite', 'star');
    favoriteButton.setColor(isFavorite ? C.grey : C.orange);
    catCards.forEach((entry) => {
      const { index, slot, breed, coat, cat: ownedCat, listing, card, icon, priceTag, favoriteMark, newTag } = entry;
      const isCurrentPage = Math.floor(slot / 28) === catPage;
      card.setVisible(isCurrentPage);
      if (entry.visible !== isCurrentPage) {
        if ((ownedCat || listing) && isCurrentPage) card.setInteractive({ useHandCursor: true });
        else card.disableInteractive();
        entry.visible = isCurrentPage;
      }
      icon.setVisible(isCurrentPage);
      favoriteMark.setVisible(isCurrentPage && ownedCat !== undefined && index === s.favorite);
      newTag?.setVisible(isCurrentPage && game.isNew(`${breed}:${coat}`));
      priceTag?.icon.setVisible(isCurrentPage);
      priceTag?.label.setVisible(isCurrentPage);
      const selectedCard = ownedCat !== undefined && index === game.selectedCat;
      card.setStrokeStyle(selectedCard ? 4 : ownedCat || listing ? 2 : 1, selectedCard ? C.orange : ownedCat ? RARITIES[catRarity(ownedCat)].color : listing ? (listing.currency === 'fish' ? C.gold : C.diamond) : C.grey);
    });
    showPager(catPage, pageCount);
  }

  refreshSelectedCat();
}
