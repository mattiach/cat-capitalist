import { AWARDS } from './awards.ts';
import { canVisitCatShop } from './catShop.ts';
import { canAffordAccessory } from './collection.ts';
import { ACCESSORIES } from './data/accessories.ts';
import { BUSINESSES } from './data/businesses.ts';
import { PERMANENT_UPGRADES } from './data/permanentUpgrades.ts';
import { UPGRADES } from './data/upgrades.ts';
import { SUPER_MANAGERS } from './data/superManagers.ts';
import { cost, hasManager, managerCost, permanentUpgradeLock, superManagersOpen } from './economy.ts';
import { investorsOpen } from './investors.ts';
import { canVisitHeaven } from './prestige.ts';
import type { State } from './state.ts';

const indexes = <T>(items: readonly T[], unlocked: (item: T, i: number) => unknown) =>
  items.flatMap((item, i) => (unlocked(item, i) ? [String(i)] : []));
const tab = (open: boolean) => (open ? ['tab'] : []);

/**
 * What is unlocked right now, per sidebar tab. "Unlocked" means a tab opened, an item's requirements
 * were met, or a priced item became affordable for the first time. Keys are `<tab>:<id>`.
 */
const SOURCES: Record<string, (s: State) => string[]> = {
  businesses: (s) => indexes(BUSINESSES, (_, i) => s.biz[i].owned || s.money >= cost(i, 0, 1)),
  managers: (s) => indexes(s.biz, (b, i) => b.manager || (b.owned && s.money >= managerCost(s, i))),
  superManagers: (s) => [...tab(superManagersOpen(s)), ...indexes(SUPER_MANAGERS, (m, i) => s.superManagers[i] || (superManagersOpen(s) && s.biz[i].owned && s.money >= m.cost))],
  investors: (s) => tab(investorsOpen(s)),
  // The Fur Emporium holds both lists: run upgrades by index, permanent ones as `p<index>`.
  upgrades: (s) => [...indexes(UPGRADES, (u, k) => s.upgrades[k] || s.money >= u.cost), ...indexes(PERMANENT_UPGRADES, (_, k) => s.permanentUpgrades[k] || (canVisitHeaven(s) && !permanentUpgradeLock(s, k))).map((k) => `p${k}`)],
  cattery: (s) => s.cats.map((cat) => `${cat.breed}:${cat.coat}`),
  catShop: (s) => tab(canVisitCatShop(s)),
  boutique: (s) => [...tab(hasManager(s)), ...indexes(ACCESSORIES, (_, k) => s.accessories[k] || canAffordAccessory(s, k))],
  awards: (s) => [...tab(hasManager(s)), ...indexes(AWARDS, (_, k) => s.awards[k])],
  heaven: (s) => tab(canVisitHeaven(s)),
};

/**
 * Latches anything newly unlocked as 'new'. Saves from before this system have no `unlocks`,
 * so their first sync records current progress as already seen instead of flagging all of it.
 */
export function syncUnlocks(s: State, status: 'new' | 'seen' = s.unlocks ? 'new' : 'seen') {
  const unlocks = (s.unlocks ??= {});
  // The Permanent Shop tab merged into the Fur Emporium: carry its keys over so nothing flashes NEW again.
  for (const key of Object.keys(unlocks)) {
    if (!key.startsWith('permanent:')) continue;
    const id = key.slice('permanent:'.length);
    if (id !== 'tab') unlocks[`upgrades:p${id}`] ??= unlocks[key];
    delete unlocks[key];
  }
  for (const [section, source] of Object.entries(SOURCES)) {
    for (const id of source(s)) unlocks[`${section}:${id}`] ??= status;
  }
}

/** Marks a tab's new unlocks as seen and returns them, so the open view can still highlight them. */
export function claimNewUnlocks(s: State, section: string) {
  const prefix = `${section}:`;
  const claimed = Object.keys(s.unlocks ?? {}).filter((key) => key.startsWith(prefix) && s.unlocks![key] === 'new');
  claimed.forEach((key) => { s.unlocks![key] = 'seen'; });
  return claimed;
}

/** Tabs holding at least one unseen unlock. */
export function sectionsWithNew(s: State) {
  const sections = new Set<string>();
  for (const [key, status] of Object.entries(s.unlocks ?? {})) {
    if (status === 'new') sections.add(key.slice(0, key.indexOf(':')));
  }
  return sections;
}
