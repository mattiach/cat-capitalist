import { ACCESSORIES, isPremiumAccessory, type Slot } from './data/accessories.ts';
import { BREEDS, COATS, FISH_CATS, RARITIES } from './data/cats.ts';
import { DIAMOND_CATS, LEGENDARY_DISCOVERY_DIAMONDS } from './data/diamonds.ts';
import { shopFactor, zoomiesBonus } from './data/permanentUpgrades.ts';
import { gainDiamonds, spend, type Cat, type State } from './state.ts';

export const ACCESSORY_BONUS = 0.03;
export const TOTAL_CAT_COMBINATIONS = BREEDS.length * COATS.length;
export type CatUnlockReward = { label: string; diamonds?: number };

export const catName = (c: Cat) => `${COATS[c.coat].name} ${BREEDS[c.breed].name}`;
export const catRarity = (c: Cat) => Math.max(BREEDS[c.breed].rarity, COATS[c.coat].rarity);
export const catBonus = (c: Cat) => c.starter ? 0
  : RARITIES[BREEDS[c.breed].rarity].bonus + RARITIES[COATS[c.coat].rarity].bonus + (c.breed * COATS.length + c.coat) / 1000;
export const catBonusPct = (c: Cat) => `${(catBonus(c) * 100).toFixed(1)}%`;
export const bestCatBonus = (s: State) => s.cats.reduce((best, c) => Math.max(best, catBonus(c)), 0);
export const bestCatBonusPct = (s: State) => `${(bestCatBonus(s) * 100).toFixed(1)}%`;
export const collectionBonus = (s: State) =>
  bestCatBonus(s) + s.accessories.reduce((sum, owned, i) => sum + (owned ? ACCESSORIES[i]?.bonus ?? ACCESSORY_BONUS : 0), 0);

export const breedsFound = (s: State) => new Set(s.cats.map((c) => c.breed)).size;
export const coatsFound = (s: State) => new Set(s.cats.map((c) => c.coat)).size;

export function undiscoveredCatCombos(s: State) {
  const discovered = new Set(s.cats.map((cat) => `${cat.breed}:${cat.coat}`));
  const breedCounts = RARITIES.map((_, rarity) => BREEDS.filter((breed) => breed.rarity === rarity).length);
  const coatCounts = RARITIES.map((_, rarity) => COATS.filter((coat) => coat.rarity === rarity).length);
  return BREEDS.flatMap((breed, breedIndex) => COATS.flatMap((coat, coatIndex) => {
    if (discovered.has(`${breedIndex}:${coatIndex}`)) return [];
    const weight = (RARITIES[breed.rarity].weight / breedCounts[breed.rarity]) *
      (RARITIES[coat.rarity].weight / coatCounts[coat.rarity]);
    return [{ breed: breedIndex, coat: coatIndex, weight }];
  }));
}

/** Undiscovered cats that luck can hand out: listed (Diamond or Golden Fish) cats are only sold in the Cat Lounge. */
export const findableCatCombos = (s: State) => undiscoveredCatCombos(s).filter((combo) => !catListing(combo.breed, combo.coat));

/** Chooses a findable breed/coat pair using the rarity odds. */
export function randomUndiscoveredCat(s: State, rand = Math.random): Cat | undefined {
  const combos = findableCatCombos(s);
  if (!combos.length) return undefined;
  let roll = rand() * combos.reduce((sum, combo) => sum + combo.weight, 0);
  const selected = combos.find((combo) => (roll -= combo.weight) < 0) ?? combos.at(-1)!;
  return { breed: selected.breed, coat: selected.coat, head: -1, face: -1, neck: -1 };
}

function awardFirstCatReward(s: State, cat: Cat, rand: () => number): CatUnlockReward {
  const rarity = catRarity(cat);
  const combo = cat.breed * COATS.length + cat.coat;
  switch (combo % 4) {
    case 0: {
      const amount = 5 * (rarity + 1);
      s.fish += amount;
      return { label: `+${amount} Golden Fish` };
    }
    case 1: {
      const amount = [250, 1_000, 5_000, 25_000][rarity];
      s.money += amount;
      s.lifetime += amount;
      return { label: `+${amount.toLocaleString('en-US')} cash` };
    }
    case 2: {
      const seconds = [8, 10, 15, 20][rarity];
      s.boost = Math.min(60 + zoomiesBonus(s), s.boost + seconds);
      return { label: `Zoomies +${seconds}s` };
    }
    default: {
      const maxCost = Math.max(ACCESSORIES[0].cost, s.lifetime * 0.002);
      const missing = ACCESSORIES.flatMap((a, i) => !s.accessories[i] && !isPremiumAccessory(a) && a.cost <= maxCost ? [i] : []);
      if (missing.length) {
        const index = missing[Math.floor(rand() * missing.length)];
        s.accessories = Array.from({ length: Math.max(s.accessories.length, index + 1) }, (_, i) => s.accessories[i] === true);
        s.accessories[index] = true;
        return { label: `${ACCESSORIES[index].name} unlocked` };
      }
      s.fish += 5;
      return { label: '+5 Golden Fish' };
    }
  }
}

/** Adds a cat and grants its small first-discovery reward only for a new breed/coat combo. */
export function addCatToCollection(s: State, cat: Cat, rand = Math.random): CatUnlockReward | undefined {
  const firstDiscovery = !s.cats.some((owned) => owned.breed === cat.breed && owned.coat === cat.coat);
  s.cats.push(cat);
  if (!firstDiscovery) return undefined;
  const reward = awardFirstCatReward(s, cat, rand);
  // Diamond-priced cats pay nothing back, so buying one is never a discount.
  if (catRarity(cat) === 3 && !diamondCat(cat.breed, cat.coat)) {
    gainDiamonds(s, LEGENDARY_DISCOVERY_DIAMONDS);
    return { label: `${reward.label} · +${LEGENDARY_DISCOVERY_DIAMONDS} Diamond`, diamonds: LEGENDARY_DISCOVERY_DIAMONDS };
  }
  return reward;
}

export const diamondCat = (breed: number, coat: number) => DIAMOND_CATS.find((cat) => cat.breed === breed && cat.coat === coat);
export const fishCat = (breed: number, coat: number) => FISH_CATS.find((cat) => cat.breed === breed && cat.coat === coat);
export type CatListing = { price: number; currency: 'diamonds' | 'fish' };
export function catListing(breed: number, coat: number): CatListing | undefined {
  const diamond = diamondCat(breed, coat);
  if (diamond) return { price: diamond.price, currency: 'diamonds' };
  const fish = fishCat(breed, coat);
  return fish && { price: fish.price, currency: 'fish' };
}

/** Buys a listed (Diamond or Golden Fish) cat that isn't owned yet. Regular first-discovery rewards still apply. */
export function buyListedCat(s: State, breed: number, coat: number, rand = Math.random) {
  const listing = catListing(breed, coat);
  if (!listing || s[listing.currency] < listing.price || s.cats.some((owned) => owned.breed === breed && owned.coat === coat)) return undefined;
  s[listing.currency] -= listing.price;
  const cat: Cat = { breed, coat, head: -1, face: -1, neck: -1 };
  return { cat, reward: addCatToCollection(s, cat, rand) };
}

/** Money price after discounts; Diamond prices never change. */
export const accessoryCost = (s: State, k: number) => Math.ceil(ACCESSORIES[k].cost * shopFactor(s));

export const canAffordAccessory = (s: State, k: number) =>
  !ACCESSORIES[k].retired && (ACCESSORIES[k].diamondCost ? s.diamonds >= ACCESSORIES[k].diamondCost : s.money >= accessoryCost(s, k));

export function buyAccessory(s: State, k: number) {
  const accessory = ACCESSORIES[k];
  if (!accessory || s.accessories[k] || !canAffordAccessory(s, k)) return false;
  if (accessory.diamondCost) s.diamonds -= accessory.diamondCost;
  else spend(s, accessoryCost(s, k));
  s.accessories =Array.from({ length: Math.max(s.accessories.length, k + 1) }, (_, i) => s.accessories[i] === true);
  s.accessories[k] = true;
  let gift: { cat: Cat; reward?: CatUnlockReward } | undefined;
  const reward = accessory.reward;
  if (reward?.kind === 'money') {
    s.money += reward.amount!;
    s.lifetime += reward.amount!;
  } else if (reward?.kind === 'fish') {
    s.fish += reward.amount!;
  } else if (reward?.kind === 'diamond') {
    gainDiamonds(s, reward.amount!);
  } else if (reward?.kind === 'boost') {
    s.boost = Math.min(60 + zoomiesBonus(s), s.boost + reward.amount!);
  } else if (reward?.kind === 'cat') {
    // Same rarity odds as the rest, or a cheap accessory would be the easiest way to a Legendary.
    const cat = randomUndiscoveredCat(s);
    if (cat) gift = { cat, reward: addCatToCollection(s, cat) };
  }
  return { gift };
}

/** Cycles a cat's slot through "none" and every owned accessory for that slot. */
export function cycleAccessory(s: State, c: number, slot: Slot, dir: 1 | -1) {
  const options = [-1, ...ACCESSORIES.flatMap((a, i) => (a.slot === slot && s.accessories[i] && !a.retired ? [i] : []))];
  const cat = s.cats[c];
  cat[slot] = options[(options.indexOf(cat[slot]) + dir + options.length) % options.length];
}
