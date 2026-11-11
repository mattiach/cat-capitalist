import { findableCatCombos, TOTAL_CAT_COMBINATIONS, undiscoveredCatCombos } from '../../logic/collection.ts';
import { buyMysteryCat, catShopPrice } from '../../logic/catShop.ts';
import { fmt } from '../../logic/format.ts';
import { C, CX, CY, GOLD, MUTED, RED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { revealCat } from '../ui/catReveal.ts';

export function catShopView(game: GameScene) {
  const { ui } = game;
  ui.title('Cat Shop', 'A mystery cat for your collection. Each purchase costs more than the last.');
  ui.box(CX + 124, CY + 72, 800, 430);
  ui.iconText(CX + 524, CY + 140, 'paw', 18, 'Mystery Cat', 32, '#ffffff', true);
  ui.txt(CX + 524, CY + 196, 'Unlocks one undiscovered breed and coat combination.\nIts identity stays hidden until you buy it.', 18, MUTED)
    .setOrigin(0.5).setAlign('center');
  const progress = ui.txt(CX + 524, CY + 278, '', 18, GOLD, true).setOrigin(0.5);
  const priceText = ui.txt(CX + 524, CY + 340, '', 24, '#ffffff', true).setOrigin(0.5);
  const buyButton = ui.button(CX + 524, CY + 418, 280, 56, '', C.orange, () => {
    const result = buyMysteryCat(game.s);
    if (!result) return ui.floatText(CX + 524, CY + 386, 'Not enough money!', RED);
    game.save();
    revealCat(game, result.cat, result.reward);
  }, 20);

  return () => {
    const price = catShopPrice(game.s);
    const undiscovered = findableCatCombos(game.s).length;
    progress.setText((TOTAL_CAT_COMBINATIONS - undiscoveredCatCombos(game.s).length) + '/' + TOTAL_CAT_COMBINATIONS + ' combinations discovered · ' + game.s.catShopPurchases + ' shop purchases');
    priceText.setText(undiscovered ? 'Next cat: ' + fmt(price) : 'No mystery cats left: the rest are sold in the Cat Lounge.');
    if (undiscovered) buyButton.setLabel('Buy Mystery Cat · ' + fmt(price));
    else buyButton.setLabel('Collection complete', 'check');
    buyButton.setDisabled(!undiscovered || game.s.money < price);
    buyButton.setColor(undiscovered && game.s.money >= price ? C.orange : C.grey);
  };
}
