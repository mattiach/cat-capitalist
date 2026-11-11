import { addCatToCollection, randomUndiscoveredCat } from './collection.ts';
import { CAT_SHOP_BASE_PRICE, CAT_SHOP_BUSINESS_COUNT, CAT_SHOP_BUSINESS_LEVEL, CAT_SHOP_EARLY_MULTIPLIER, CAT_SHOP_EARLY_PURCHASES, CAT_SHOP_PRICE_MULTIPLIER } from './data/catShop.ts';
import { catShopFactor } from './data/permanentUpgrades.ts';
import { spend, type State } from './state.ts';

export const catShopBusinessProgress = (s: State) =>
  s.biz.filter((business) => business.owned >= CAT_SHOP_BUSINESS_LEVEL).length;

export const canVisitCatShop = (s: State) =>
  catShopBusinessProgress(s) >= CAT_SHOP_BUSINESS_COUNT;

export const catShopPrice = (s: State) =>
  catShopFactor(s)
  * CAT_SHOP_BASE_PRICE
  * CAT_SHOP_EARLY_MULTIPLIER ** Math.min(s.catShopPurchases, CAT_SHOP_EARLY_PURCHASES)
  * CAT_SHOP_PRICE_MULTIPLIER ** Math.max(0, s.catShopPurchases - CAT_SHOP_EARLY_PURCHASES);

export function buyMysteryCat(s: State, rand = Math.random) {
  if (!canVisitCatShop(s)) return undefined;
  const price = catShopPrice(s);
  if (s.money < price) return undefined;
  const cat = randomUndiscoveredCat(s, rand);
  if (!cat || !spend(s, price)) return undefined;
  s.catShopPurchases++;
  const reward = addCatToCollection(s, cat);
  return { cat, reward, price };
}
