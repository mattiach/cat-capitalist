import { readdirSync } from 'node:fs';
import { accessoryCost } from './collection.ts';
import { catShopPrice } from './catShop.ts';
import { spend } from './state.ts';
// Run with: node src/logic/check.ts
import { AWARD_GROUPS, AWARDS, checkAwards } from './awards.ts';
import { addCatToCollection, buyAccessory, buyListedCat, catRarity, cycleAccessory } from './collection.ts';
import { BREEDS, COATS } from './data/cats.ts';
import { DIAMOND_CATS, STRAY_DIAMOND_CHANCE } from './data/diamonds.ts';
import { buyTrack, changeVolume, currentTrack, MUSIC_TRACKS, ownsTrack, selectTrack, stepTrack, toggleMusic, trackCost, trackPrice } from './music.ts';
import { CHEATS, redeemCheat } from './cheats.ts';
import { ACCESSORIES, isPremiumAccessory, SLOTS } from './data/accessories.ts';
import { BUSINESSES } from './data/businesses.ts';
import { PERMANENT_UPGRADES } from './data/permanentUpgrades.ts';
import { INVESTORS } from './data/investors.ts';
import { SUPER_MANAGERS, SUPER_MULT, SUPER_ZOOMIES_TIME } from './data/superManagers.ts';
import { UPGRADES } from './data/upgrades.ts';
import { collectInvestment, investorProfit, investorReturn, investorsOpen, investorStatus, startInvestment } from './investors.ts';
import { buy, buyPermanentUpgrade, cost, cycleTime, hire, hireSuper, managerCost, maxAffordable, permanentUpgradeLock, profitMult, revenue, superManagersOpen, tick, ZOOMIES_MULT } from './economy.ts';
import { fmt, fmtCompact, fmtTime } from './format.ts';
import { accessoryTipDue, autoHireFirstManager, FREE_MANAGER_LEVEL, managerTipDue, managerTipTarget } from './tips.ts';
import { angelsToClaim, ascend, ascendFish, canAscend, lifetimeForAngels, MAX_ANGELS, minAscendClaim } from './prestige.ts';
import { isVictory } from './victory.ts';
import { gainDiamonds, load, newState, parseSaveData, restartedState } from './state.ts';
import { catchStray } from './strays.ts';
import { claimNewUnlocks, sectionsWithNew, syncUnlocks } from './unlocks.ts';

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

const s = newState();
ok(s.biz[0].owned === 1 && s.cats.length === 1, 'starts with one yarn stand and one cat');

// manual cycle pays once (starter cat keeps the base multiplier at 1.0x) and stops
s.biz[0].running = true;
ok(near(tick(s, 0.6), 1) && !s.biz[0].running, 'manual cycle pays once');
ok(tick(s, 5) === 0, 'idle business earns nothing');

// bulk cost matches sum of single costs, max buy never overspends
const sum = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((a, k) => a + cost(1, k, 1), 0);
ok(Math.abs(cost(1, 0, 10) - sum) < 1e-6, 'bulk cost = sum of singles');
for (const money of [0, 59, 60, 1234, 1e9]) {
  const n = maxAffordable(1, 3, money);
  ok(cost(1, 3, n) <= money && cost(1, 3, n + 1) > money, `max buy exact for ${money}`);
}
ok(!buy(s, 1, 1), 'cannot buy without money');

// milestones: faster cycles, and fish only the first time ever
ok(cycleTime(0, 25) === 0.3 && cycleTime(0, 50) === 0.15, 'milestones double speed');
s.money = 1e9;
buy(s, 0, 49);
ok(s.fish === 10 && s.best[0] === 50, 'two milestones = 10 fish');
s.biz[0].owned = 1;
buy(s, 0, 49);
ok(s.fish === 10, 'no fish for re-reaching milestones');

// managers run multiple cycles per tick; zoomies only boosts while it lasts
const m = newState();
m.money = managerCost(m, 0);
ok(hire(m, 0) && m.money === 0, 'hire manager');
m.boost = 0.6;
ok(near(tick(m, 1.2), 1 * 7 + 1) && m.boost === 0, 'zoomies boost split at its end');

// first discovery of a Legendary pays its fish
const c = newState();
c.fish = 100;
addCatToCollection(c, { breed: 7, coat: 0, head: -1, face: -1, neck: -1 }, () => 0);
ok(c.fish === 120, 'legendary cat first discovery reward');

// accessories: equip cycles through owned ones for that slot only
c.money = 1e6;
ok(buyAccessory(c, 0) && !buyAccessory(c, 0), 'buy pink bow once');
cycleAccessory(c, 0, 'head', 1);
ok(ACCESSORIES[c.cats[0].head].name === 'Pink Bow', 'equip bow');
cycleAccessory(c, 0, 'head', 1);
ok(c.cats[0].head === -1, 'cycle back to none');

// strays and awards
ok(catchStray(c, 0.05).includes('Fish') && c.fish === 125, 'stray fish');
ok(catchStray(c, 0.2).includes('ZOOMIES') && c.boost === 30, 'stray zoomies');
const got = checkAwards(c).map((a) => a.name);
ok(got.includes('New Friend') && got.includes('Pure Gold') && !got.includes('First Purr') && checkAwards(c).length === 0, 'awards once');
ok(c.fish === 120 + 5 + 15 + 50 + 15 + 5, 'awards pay fish'); // New Friend, Pure Gold, First Sparkle for the Legendary's Diamond, Lucky Paws for the stray

// prestige keeps the collection
c.lifetime = lifetimeForAngels(300);
const next = ascend(c);
ok(next.angels === 300 && next.money === 0 && next.cats.length === 2 && next.fish === c.fish + 85, 'ascend');

ok(fmt(1234) === '$1,234' && fmt(1.5e6) === '$1.50 M' && fmt(2e9) === '$2.00 B', 'fmt');
ok(fmtTime(3661) === '01:01:01', 'fmtTime');
ok(load('garbage').money === 0 && load(null).biz.length === 10, 'bad save falls back to new game');
ok(load(JSON.stringify({ money: 5, biz: newState().biz })).cats.length === 1, 'old save gets new fields');

// permanent upgrades: requirements, top price, independent speed bonuses
const p = newState();
p.fish = 1e3;
ok(Math.max(...PERMANENT_UPGRADES.slice(0, 5).map((u) => u.cost)) < PERMANENT_UPGRADES[5].cost, 'Lightning Paws is the priciest');
ok(!buyPermanentUpgrade(p, 0), 'first ascension required');
p.ascensions = PERMANENT_UPGRADES[5].ascensions;
ok(permanentUpgradeLock(p, 5) === 'Requires Quick Paws' && !buyPermanentUpgrade(p, 5), 'previous tier required');
ok(buyPermanentUpgrade(p, 4) && buyPermanentUpgrade(p, 5) && !buyPermanentUpgrade(p, 5) && p.fish === 1e3 - 150, 'tiers buy once');
for (const [i] of p.biz.entries()) {
  ok(near(cycleTime(i, 25, p), BUSINESSES[i].time / 2 / 1.05 / 1.1), `speed bonuses and milestone stack on business ${i}`);
}
// late-game permanent upgrades: priced above the early ones, gated in tiers, and they stack
const lateUpgrades = PERMANENT_UPGRADES.slice(6, 11);
ok(PERMANENT_UPGRADES.every((u) => u.ascensions <= 1) && PERMANENT_UPGRADES.every((u) => u.requires === undefined || PERMANENT_UPGRADES[u.requires].cost < u.cost), 'every permanent upgrade after one ascension, each tier pricier than the last');
ok(lateUpgrades.length >= 3 && lateUpgrades.every((u) => u.cost > PERMANENT_UPGRADES[5].cost && u.ascensions === 1 && (u.profit ?? u.speed ?? 0) > 1), 'late upgrades are expensive, gated and useful');
const lateBuyer = newState();
lateBuyer.fish = 1e4;
lateBuyer.ascensions = 100;
const incomeBefore = profitMult(lateBuyer);
const whiskers = PERMANENT_UPGRADES.findIndex((u) => u.name === 'Golden Whiskers');
const fortune = PERMANENT_UPGRADES.findIndex((u) => u.name === 'Feline Fortune');
ok(!buyPermanentUpgrade(lateBuyer, fortune) && permanentUpgradeLock(lateBuyer, fortune) === 'Requires Golden Whiskers', 'late tiers buy in order');
ok(buyPermanentUpgrade(lateBuyer, whiskers) && buyPermanentUpgrade(lateBuyer, fortune), 'late tiers unlock in turn');
ok(near(profitMult(lateBuyer), incomeBefore * 6), 'profit upgrades multiply together');
ok(ascend({ ...lateBuyer, lifetime: lifetimeForAngels(10) }).permanentUpgrades[fortune], 'late upgrades survive ascending');
const turbo = newState();
turbo.permanentUpgrades[PERMANENT_UPGRADES.findIndex((u) => u.name === 'Turbo Tail')] = true;
ok(near(cycleTime(0, 1, turbo), 0.6 / 1.25), 'Turbo Tail speeds up cycles');
const quick = newState();
quick.permanentUpgrades[5] = true;
ok(near(cycleTime(0, 1, quick), 0.6 / 1.1), 'Lightning Paws alone is 10% faster');
const grandfathered = load(JSON.stringify({ biz: newState().biz, permanentUpgrades: [true, true] }));
ok(managerCost(grandfathered, 0) === Math.ceil(BUSINESSES[0].managerCost * 0.9), 'upgrades bought before the rebalance still work');

// ascending needs a meaningful reward
const a = newState();
a.lifetime = lifetimeForAngels(1);
ok(angelsToClaim(a) === 1 && !canAscend(a) && ascend(a) === a, 'one Angel Cat cannot ascend');
a.lifetime = lifetimeForAngels(2);
ok(angelsToClaim(a) === 2 && canAscend(a), 'two Angel Cats can ascend');
const veteran = newState();
veteran.angels = 500;
veteran.lifetime = lifetimeForAngels(549);
ok(minAscendClaim(veteran) === 50 && !canAscend(veteran), 'gain must keep up with Angel Cats owned');
veteran.lifetime = lifetimeForAngels(1100);
ok(canAscend(veteran), 'a 10% gain can ascend');
for (let n = 1; n <= MAX_ANGELS; n += 7) {
  const probe = newState();
  probe.lifetime = lifetimeForAngels(n);
  ok(angelsToClaim(probe) === n, `lifetimeForAngels(${n}) round-trips`);
}

// cheats: the description changed, the code did not; LION still leaves Heaven usable
const zoomies = CHEATS.find((cheat) => cheat.code === 'ZOOMIES')!;
ok(zoomies.reward === 'Better together, paws close and hearts closer!', 'zoomies description');
const lion = newState();
lion.angels = 10;
ok(redeemCheat(lion, 'lion').ok && canAscend(lion) && lion.money === 1e9, 'LION makes ascending possible, pays $1 B');
const capped = { ...newState(), angels: 990, lifetime: lifetimeForAngels(5000) };
ok(angelsToClaim(capped) === 10 && canAscend(capped) && ascend(capped).angels === MAX_ANGELS && !canAscend({ ...ascend(capped), lifetime: 1e40 }), 'Angel Cats stop at the cap');
const won = newState();
redeemCheat(won, 'lion');
ok(!isVictory(won), 'LION alone is not a victory');
won.superManagers = SUPER_MANAGERS.map(() => true);
won.permanentUpgrades = PERMANENT_UPGRADES.map(() => true);
ok(isVictory(won) && !isVictory({ ...won, cats: won.cats.slice(0, -1) }), 'victory needs everything');
ok(isVictory({ ...won, accessories: ACCESSORIES.map((a) => !a.special) }) && ACCESSORIES.some((a) => a.special), 'Specials are never needed to win');
const gifted = newState();
const gift = redeemCheat(gifted, 'CAT');
ok(gift.ok && 'cat' in gift && gifted.cats.at(-1) === gift.cat, 'CAT returns the cat to reveal');
const gooseSave = newState();
gooseSave.money = 1e9;
const pond = ACCESSORIES.findIndex((item) => item.reward?.kind === 'cat');
const purchase = buyAccessory(gooseSave, pond);
ok(purchase && gooseSave.cats.at(-1) === purchase.gift?.cat, 'cat accessories return the cat to reveal');

// unlock feedback: latches, clears once, survives saves, and never floods old saves
const u = newState();
syncUnlocks(u);
ok(u.unlocks?.['businesses:0'] === 'seen' && sectionsWithNew(u).size === 0, 'new game has nothing to flag');
u.money = 5e3;
syncUnlocks(u);
ok(sectionsWithNew(u).has('boutique') && u.unlocks?.['boutique:0'] === 'new' && u.unlocks?.['upgrades:0'] === undefined, 'first affordable accessory is new');
u.money = 0;
syncUnlocks(u);
ok(u.unlocks?.['boutique:0'] === 'new', 'stays new after the money is spent');
ok(claimNewUnlocks(u, 'boutique').includes('boutique:0') && !sectionsWithNew(u).has('boutique'), 'visiting a tab clears it');
u.money = 5e3;
syncUnlocks(u);
ok(claimNewUnlocks(u, 'boutique').length === 0, 'seen items do not come back');
const reloaded = load(JSON.stringify(u));
syncUnlocks(reloaded);
ok(reloaded.unlocks?.['boutique:0'] === 'seen' && reloaded.unlocks?.['managers:0'] === 'new', 'status survives a reload');
u.lifetime = lifetimeForAngels(10);
const reborn = ascend(u);
syncUnlocks(reborn);
ok(reborn.unlocks?.['boutique:0'] === 'seen' && reborn.money === 0, 'status survives an ascension');
const legacy = load(JSON.stringify({ money: 1e9, biz: newState().biz, cats: newState().cats }));
ok(legacy.unlocks === undefined, 'legacy saves load without unlock data');
syncUnlocks(legacy);
ok(sectionsWithNew(legacy).size === 0 && legacy.unlocks?.['boutique:0'] === 'seen', 'legacy progress counts as seen');
ok(parseSaveData(JSON.stringify({ biz: newState().biz, unlocks: { x: 'nope' } })) === undefined, 'bad unlock data is rejected');

// diamonds: start at zero, rare stray reward, survive saves and ascending, no conversion back
const d = newState();
ok(d.diamonds === 0, 'new games start with 0 diamonds');
ok(catchStray(d, 0.5).includes('wallet') && catchStray(d, 0.98).includes('wallet') && d.diamonds === 0, 'most strays pay no diamond');
ok(catchStray(d, 1 - STRAY_DIAMOND_CHANCE / 2).includes('Diamond') && d.diamonds === 1, 'rare stray pays a diamond');
d.lifetime = lifetimeForAngels(10);
const dNext = ascend(d);
ok(dNext.diamonds === 1 && dNext.money === 0, 'diamonds survive ascending');
const dLoaded = load(JSON.stringify(dNext));
ok(dLoaded.diamonds === 1, 'diamonds survive a reload');
const oldSave = load(JSON.stringify({ money: 5, fish: 9, biz: newState().biz }));
ok(oldSave.fish === 9 && oldSave.diamonds === 0 && oldSave.musicOwned.length === 0 && oldSave.musicSelected === null && oldSave.musicOn, 'old saves get safe defaults');
ok(parseSaveData(JSON.stringify({ biz: newState().biz, diamonds: -1 })) === undefined && parseSaveData(JSON.stringify({ biz: newState().biz, diamonds: 1.5 })) === undefined, 'bad diamond counts are rejected');

// diamond discovery reward: Legendary only, once per cat
const legendary = newState();
const rollNothing = () => 0;
addCatToCollection(legendary, { breed: 0, coat: 0, head: -1, face: -1, neck: -1 }, rollNothing);
addCatToCollection(legendary, { breed: 0, coat: 2, head: -1, face: -1, neck: -1 }, rollNothing);
ok(legendary.diamonds === 0, 'common cats pay no diamond');
const firstFind = addCatToCollection(legendary, { breed: 7, coat: 0, head: -1, face: -1, neck: -1 }, rollNothing);
ok(legendary.diamonds === 1 && firstFind?.diamonds === 1, 'first Legendary discovery pays a diamond');
ok(addCatToCollection(legendary, { breed: 7, coat: 0, head: -1, face: -1, neck: -1 }, rollNothing) === undefined && legendary.diamonds === 1, 'no second reward for the same cat');
ok(load(JSON.stringify(legendary)).diamonds === 1, 'loading grants nothing');

// diamond-priced cats: price checks, one purchase, kept after ascending, no diamond refund
const shopper = newState();
const listing = DIAMOND_CATS.at(-1)!;
ok(BREEDS[listing.breed] && COATS[listing.coat] && DIAMOND_CATS.every((item) => item.price > 0), 'diamond cats point at real breeds and coats');
shopper.diamonds = listing.price - 1;
ok(buyListedCat(shopper, listing.breed, listing.coat) === undefined && shopper.cats.length === 1 && shopper.diamonds === listing.price - 1, 'not enough diamonds');
ok(buyListedCat(shopper, 0, 1) === undefined, 'unlisted cats cannot be bought');
shopper.diamonds = listing.price * 2;
const bought = buyListedCat(shopper, listing.breed, listing.coat, rollNothing);
ok(bought !== undefined && shopper.cats.length === 2 && shopper.diamonds === listing.price && !bought.reward?.diamonds, 'buys a diamond cat with no diamond refund');
ok(buyListedCat(shopper, listing.breed, listing.coat) === undefined && shopper.diamonds === listing.price && shopper.cats.length === 2, 'no duplicate purchase');
shopper.lifetime = lifetimeForAngels(10);
ok(ascend(shopper).cats.length === 2 && load(JSON.stringify(ascend(shopper))).cats.length === 2, 'diamond cats survive ascending and reloading');

// boutique: diamond prices stay within 1-3, diamond rewards stay at 1, and gifts never hand them out
const priced = ACCESSORIES.filter((a) => a.diamondCost);
const paying = ACCESSORIES.filter((a) => a.reward?.kind === 'diamond');
ok(priced.length >= 3 && priced.some((a) => a.diamondCost === 1) && priced.every((a) => a.diamondCost! >= 1 && a.diamondCost! <= 12), 'a Diamond collection from 1 to 12 diamonds');
for (const slot of SLOTS) {
  const prices = ACCESSORIES.filter((a) => a.slot === slot && !a.diamondCost).map((a) => a.cost);
  ok(prices.length >= 15 && Math.min(...prices) < 100 && Math.max(...prices) >= 1e13 && ACCESSORIES.some((a) => a.slot === slot && a.diamondCost), `${slot} items run from pocket money to diamonds`);
}
ok(new Set(ACCESSORIES.map((a) => a.name)).size === ACCESSORIES.length && new Set(ACCESSORIES.map((a) => a.icon)).size === ACCESSORIES.length, 'every item has its own name and drawing');
ok(BUSINESSES[0].managerCost === 800, 'the first manager costs $800');
ok(paying.length >= 2 && paying.length <= 3 && paying.every((a) => a.reward!.amount === 1), 'two or three items pay one diamond');
const bq = newState();
const pin = ACCESSORIES.indexOf(priced[0]);
bq.money = 1e30;
ok(!buyAccessory(bq, pin) && bq.money === 1e30 && !bq.accessories[pin], 'money cannot buy a diamond item');
bq.diamonds = priced[0].diamondCost!;
ok(buyAccessory(bq, pin) && bq.diamonds === 0 && bq.money === 1e30 && !buyAccessory(bq, pin), 'diamonds buy it once');
const chest = ACCESSORIES.indexOf(paying[0]);
const foundBefore = bq.diamondsFound;
ok(buyAccessory(bq, chest) && bq.diamonds === 1 && bq.diamondsFound === foundBefore + 1 && !buyAccessory(bq, chest) && bq.diamonds === 1, 'a paying item pays one diamond, once');
const gifting = newState();
gifting.accessories = ACCESSORIES.map((a) => !isPremiumAccessory(a));
const meow = redeemCheat(gifting, 'MEOW');
ok(!meow.ok && ACCESSORIES.every((a, i) => !isPremiumAccessory(a) || !gifting.accessories[i]), 'MEOW never hands out diamond items');

// cat gifts from accessories respect rarity odds
const oddsSeen = Array.from({ length: 400 }, () => {
  const g = newState();
  g.money = 1e9;
  const result = buyAccessory(g, pond);
  return result && result.gift ? catRarity(result.gift.cat) : 0;
});
ok(oddsSeen.filter((rarity) => rarity === 3).length < 60, 'cat gifts follow rarity odds');

// diamond awards count every diamond found, spent or not, and older saves keep what they had
const hoard = newState();
gainDiamonds(hoard, 5);
hoard.diamonds = 0;
const hoardNames = checkAwards(hoard).map((award) => award.name);
ok(hoardNames.includes('First Sparkle') && hoardNames.includes('Shiny Handful') && !hoardNames.includes('Gem Collector'), 'diamond awards track found diamonds');
ok(load(JSON.stringify({ biz: newState().biz, diamonds: 4 })).diamondsFound === 4, 'older saves count their diamonds as found');
for (const n of [1, 5, 10, 50, 100]) ok(AWARDS.some((award) => award.desc === `Find ${n} ${n === 1 ? 'Diamond' : 'Diamonds'}`), `an award for ${n} diamonds`);
ok(AWARDS.every((award) => AWARD_GROUPS.includes(award.group)) && new Set(AWARDS.map((award) => award.name)).size === AWARDS.length, 'awards are grouped and unique');

// late game: ascension fish are capped
ok(ascendFish(1e12) === 150 && ascendFish(100) === 50, 'ascension fish are capped');

// music: free default, fish purchases, selection survives saves, stale data falls back
const mu = newState();
ok(new Set(MUSIC_TRACKS.map((item) => item.fileName)).size === MUSIC_TRACKS.length && new Set(MUSIC_TRACKS.map((item) => item.title)).size === MUSIC_TRACKS.length, 'distinct tracks');
ok(readdirSync('public/music').filter((file) => !file.startsWith('.')).every((file) => MUSIC_TRACKS.some((item) => item.fileName === file)), 'every file in public/music is listed');
const prices = MUSIC_TRACKS.map(trackPrice).filter(Boolean);
ok(prices.every((price, k) => !k || price > prices[k - 1]) && Math.max(...prices) <= 200e3, 'track prices climb, never past $200 K');
ok(MUSIC_TRACKS.filter((item) => ownsTrack(mu, item)).length === Math.floor(MUSIC_TRACKS.length / 2), 'half the tracks are free from the start');
const free = MUSIC_TRACKS[0];
const paid = MUSIC_TRACKS.find((item) => trackPrice(item) > 0)!;
ok(currentTrack(mu) === free, 'first track is the default');
ok(selectTrack(mu, MUSIC_TRACKS[2].fileName) && currentTrack(mu) === MUSIC_TRACKS[2], 'free tracks can be selected right away');
mu.musicSelected = null;
ok(!selectTrack(mu, paid.fileName) && mu.musicSelected === null, 'cannot select an unowned track');
mu.fish = 1e6;
mu.money = trackPrice(paid) - 1;
ok(!buyTrack(mu, paid.fileName) && mu.money === trackPrice(paid) - 1 && mu.fish === 1e6, 'tracks cost money, not fish');
mu.money = trackPrice(paid);
ok(buyTrack(mu, paid.fileName) && mu.money === 0 && mu.fish === 1e6, 'buying a track deducts its price');
mu.money = 1e6;
ok(!buyTrack(mu, paid.fileName) && mu.money === 1e6 && mu.musicOwned.length === 1, 'track buys once');
ok(!buyTrack(mu, free.fileName) && mu.musicOwned.length === 1, 'free tracks are not bought');
ok(selectTrack(mu, paid.fileName) && currentTrack(mu) === paid, 'select an owned track');
toggleMusic(mu);
const muLoaded = load(JSON.stringify(mu));
ok(muLoaded.musicOwned.includes(paid.fileName) && muLoaded.musicSelected === paid.fileName && !muLoaded.musicOn, 'music survives a reload');
mu.musicShuffle = false;
ok(stepTrack(mu, 1) && currentTrack(mu) === free && stepTrack(mu, -1) && currentTrack(mu) === paid, 'switching wraps through owned tracks');
mu.lifetime = lifetimeForAngels(10);
ok(ascend(mu).musicOwned.includes(paid.fileName), 'music survives ascending');

// audio levels: clamped, clean, kept with purchased music through ascending, reloading and restarting
const au = newState();
ok(au.musicVolume > 0 && au.sfxVolume > 0, 'audio is on by default');
au.sfxVolume = 0.7;
changeVolume(au, 'sfxVolume', 1);
changeVolume(au, 'sfxVolume', 1);
ok(au.sfxVolume === 0.9, 'volume steps stay clean');
for (let k = 0; k < 20; k++) changeVolume(au, 'musicVolume', -1);
ok(au.musicVolume === 0, 'volume stops at zero');
for (let k = 0; k < 20; k++) changeVolume(au, 'sfxVolume', 1);
ok(au.sfxVolume === 1, 'volume stops at full');
au.musicOwned = [paid.fileName];
au.lifetime = lifetimeForAngels(10);
const auNext = ascend(au);
ok(auNext.musicVolume === 0 && auNext.sfxVolume === 1, 'audio levels survive ascending');
const auLoaded = load(JSON.stringify(auNext));
ok(auLoaded.musicVolume === 0 && auLoaded.sfxVolume === 1 && auLoaded.musicOwned.includes(paid.fileName), 'audio levels and tracks survive a reload');
const auNew = restartedState({ ...auLoaded, money: 1e9, fish: 50 });
ok(auNew.money === 0 && auNew.fish === 0 && auNew.ascensions === 0 && auNew.musicOwned.length === 0 && auNew.musicSelected === null && auNew.sfxVolume === 1, 'a new game clears bought songs and keeps audio levels');
const oldAudio = load(JSON.stringify({ biz: newState().biz, musicOwned: ['midnight-purring.mp3'], musicSelected: 'midnight-purring.mp3' }));
ok(oldAudio.musicVolume === newState().musicVolume && oldAudio.sfxVolume === newState().sfxVolume && currentTrack(oldAudio) === free, 'older saves get default levels, and old placeholder tracks fall back');
const badAudio = load(JSON.stringify({ biz: newState().biz, money: 7, musicVolume: 'loud', sfxVolume: 9 }));
ok(badAudio.money === 7 && badAudio.musicVolume === newState().musicVolume && badAudio.sfxVolume === 1, 'bad audio levels never cost a save');
const stale = newState();
stale.musicSelected = 'deleted-song.mp3';
ok(currentTrack(stale) === free && !buyTrack(stale, 'deleted-song.mp3'), 'tracks removed from the list fall back to the default');

// early-game tips
const tipped = newState();
ok(managerTipTarget(tipped) === 0 && !autoHireFirstManager(tipped), 'a new game suggests the first manager and hires nobody');
tipped.biz[0].owned = FREE_MANAGER_LEVEL;
ok(autoHireFirstManager(tipped) && tipped.biz[0].manager && tipped.money === 0, 'level 25 hires the first manager for free');
ok(!autoHireFirstManager(tipped), 'the free manager is granted once');
ok(managerTipTarget(tipped) === -1, 'no tip without an unmanaged business');
ok(!managerTipDue(89) && managerTipDue(90) && !managerTipDue(91) && managerTipDue(330), 'manager tips stay occasional');
ok(!accessoryTipDue(tipped), 'no accessory tip before the first accessory');
tipped.accessories[0] = true;
ok(accessoryTipDue(tipped), 'first accessory triggers the tip');
tipped.accessoryTipShown = true;
ok(!accessoryTipDue(tipped), 'the accessory tip shows once');
ok(fmtCompact(999) === '999' && fmtCompact(1299) === '1.2K' && fmtCompact(2.5e6) === '2.5M' && fmtCompact(1e40).length <= 8, 'compact numbers stay short');

// stepping-stone permanent upgrades
const perkIndex = (effect: string) => PERMANENT_UPGRADES.findIndex((u) => u.effect === effect);
const perked = newState();
const basePrice = catShopPrice(perked);
for (const [effect, factor] of [['catShop10', 0.9], ['catShop20', 0.8], ['catShop30', 0.7]] as const) {
  perked.permanentUpgrades[perkIndex(effect)] = true;
  ok(near(catShopPrice(perked), basePrice * factor), `${effect} sets the Cat Shop discount`);
}
const shopCost = accessoryCost(perked, 0);
perked.permanentUpgrades[perkIndex('shop20')] = true;
ok(accessoryCost(perked, 0) < shopCost && trackCost(perked, MUSIC_TRACKS.at(-1)!) === Math.ceil(trackPrice(MUSIC_TRACKS.at(-1)!) * 0.8), 'shop discount covers Boutique and Music Store');
perked.permanentUpgrades[perkIndex('managerDiscount15')] = true;
ok(managerCost(perked, 0) === Math.ceil(BUSINESSES[0].managerCost * 0.85), 'top manager discount applies');
PERMANENT_UPGRADES.forEach((u) => ok(u.requires === undefined || PERMANENT_UPGRADES[u.requires].ascensions <= u.ascensions, `${u.name} requires something reachable first`));

// lucky purchases
const realRandom = Math.random;
const lucky = newState();
lucky.money = 1000;
Math.random = () => 0;
spend(lucky, 500);
ok(lucky.fish === 0, 'no lucky fish without the upgrade');
lucky.permanentUpgrades[perkIndex('luckyFish1')] = true;
spend(lucky, 400);
ok(lucky.fish === 5 && lucky.foundFish === 5, 'a lucky purchase finds a fish');
lucky.money = 1e6;
spend(lucky, 10);
ok(lucky.fish === 5, 'pocket-change purchases never pay out');
lucky.permanentUpgrades[perkIndex('luckyFishDouble')] = true;
spend(lucky, 1e5);
ok(lucky.fish === 15, 'Golden Net doubles the find');
Math.random = () => 0.5;
spend(lucky, 1e5);
ok(lucky.fish === 15, 'an unlucky roll finds nothing');
Math.random = realRandom;

// shuffle only ever picks owned tracks
const shuffled = newState();
shuffled.musicShuffle = true;
for (let k = 0; k < 40; k++) {
  ok(stepTrack(shuffled, 1) && ownsTrack(shuffled, currentTrack(shuffled)!), 'shuffle stays on owned tracks');
}
ok(newState().musicVolume === 0.6 && newState().sfxVolume === 1, 'music defaults to 60%, sounds to 100%');

ok(BUSINESSES.every((b) => b.personality && b.intro) && new Set(BUSINESSES.map((b) => b.personality)).size === BUSINESSES.length, 'every manager has their own personality');

// songs and shuffle persist in the save data, for localStorage and .save files alike
const saved = newState();
saved.musicOwned = [paid.fileName];
saved.musicShuffle = true;
const savedBack = parseSaveData(JSON.stringify(saved))!;
ok(savedBack.musicOwned.includes(paid.fileName) && savedBack.musicShuffle, 'bought songs and shuffle survive a save');
ok(restartedState(savedBack).musicShuffle, 'the shuffle preference survives a new game');
ok(parseSaveData(JSON.stringify({ ...saved, musicShuffle: 'yes' }))!.musicShuffle === true, 'a bad shuffle value falls back to on');

console.log('logic ok');

// super managers: locked until Tuna Cannery, need the business owned, boost for good, reward once, survive ascending
const sm = newState();
sm.money = 1e30;
ok(!hireSuper(sm, 0), 'super managers locked before Tuna Cannery');
const diamondsBefore = sm.diamonds;
buy(sm, 5, 1);
ok(sm.diamonds === diamondsBefore + 1 && superManagersOpen(sm), 'first Tuna Cannery pays a Diamond and opens the tab');
ok(!hireSuper(sm, 9), 'no super manager for a business not owned');
const yarnBefore = revenue(sm, 0);
ok(hireSuper(sm, 0) && near(revenue(sm, 0) / yarnBefore / (sm.boost > 0 ? ZOOMIES_MULT : 1), SUPER_MULT) && sm.boost === SUPER_ZOOMIES_TIME, 'super manager boosts profit and pays Zoomies');
ok(!hireSuper(sm, 0), 'super manager hired once');
buy(sm, 2, 1);
const angelsBefore = sm.angels;
const claimBefore = angelsToClaim(sm);
ok(hireSuper(sm, 2) && sm.angels === angelsBefore + 1 && angelsToClaim(sm) === claimBefore, 'gifted Angel Cat does not shrink the claim');
sm.lifetime = 1e20;
const smAfter = ascend(sm);
ok(smAfter.superManagers[0] && superManagersOpen(smAfter) && !smAfter.biz[5].owned, 'super managers and the tab survive ascending');
const tunaDiamonds = smAfter.diamonds;
smAfter.money = 1e30;
buy(smAfter, 5, 1);
ok(smAfter.diamonds === tunaDiamonds, 'Tuna Cannery Diamond pays only once');
ok(parseSaveData(JSON.stringify({ ...newState(), superManagers: 'x' })) === undefined && load(JSON.stringify({ ...newState(), superManagers: undefined })).superManagers.length === 0, 'save parsing covers super managers');
console.log('super manager checks ok');

// investors: gated by super managers, capital up front, absolute times, cooldown after collecting
const inv = newState();
const [fast, slow] = INVESTORS.filter((item) => !item.trade);
inv.money = fast.cost * 20;
ok(!investorsOpen(inv) && !startInvestment(inv, fast, 0), 'investors locked with no super managers');
inv.superManagers[0] = true;
ok(investorsOpen(inv), 'investors open with one super manager');
const invBroke = newState();
invBroke.superManagers = [true, true];
invBroke.money = fast.cost - 1;
ok(!startInvestment(invBroke, fast, 0) && invBroke.money === fast.cost - 1 && investorStatus(invBroke, fast.id, 0) === 'available', 'no investing without the money');
const invMoney = inv.money;
ok(startInvestment(inv, fast, 1000) && inv.money === invMoney - fast.cost && investorStatus(inv, fast.id, 1000) === 'investing', 'investing takes the capital');
ok(!startInvestment(inv, fast, 2000) && inv.money === invMoney - fast.cost, 'no investing twice at once');
ok(startInvestment(inv, slow, 1000) && investorStatus(inv, fast.id, 1000) === 'investing' && investorStatus(inv, slow.id, 1000) === 'investing', 'investments run side by side');
const fastDone = 1000 + fast.minutes * 60000;
ok(!collectInvestment(inv, fast, fastDone - 1) && investorStatus(inv, fast.id, fastDone) === 'ready' && investorStatus(inv, slow.id, fastDone) === 'investing', 'ready only at the end, independently');
const reopened = load(JSON.stringify(inv));
const longAfter = fastDone + 7 * 24 * 3600000;
ok(investorStatus(reopened, fast.id, longAfter) === 'ready' && investorStatus(reopened, slow.id, longAfter) === 'ready', 'finished offline, collectable on reopening, never expires');
const moneyBefore = reopened.money;
const earnedBefore = reopened.lifetime;
ok(collectInvestment(reopened, fast, longAfter) && near(reopened.money - moneyBefore, investorReturn(fast)) && near(reopened.lifetime - earnedBefore, investorProfit(fast)), 'collecting pays capital plus profit, only the profit is earnings');
ok(!collectInvestment(reopened, fast, longAfter), 'collects once');
const cooled = { ...INVESTORS.find((item) => item.cooldownMinutes)! };
const cd = newState();
cd.superManagers = [true, true];
cd.money = cooled.cost * 3;
startInvestment(cd, cooled, 0);
const cdCollect = cooled.minutes * 60000 + 5000;
ok(investorStatus(cd, cooled.id, cdCollect) === 'ready' && collectInvestment(cd, cooled, cdCollect), 'cooldown offer collects');
const cdEnd = cdCollect + cooled.cooldownMinutes * 60000;
ok(investorStatus(cd, cooled.id, cdEnd - 1) === 'cooldown' && !startInvestment(cd, cooled, cdEnd - 1), 'cooldown starts at collection and blocks restarting');
const cdReload = load(JSON.stringify(cd));
ok(investorStatus(cdReload, cooled.id, cdEnd) === 'available' && startInvestment(cdReload, cooled, cdEnd), 'cooldown runs out offline, then it can restart');
ok(INVESTORS.every((item) => item.minutes >= 5 && item.minutes <= 60) && new Set(INVESTORS.map((item) => item.id)).size === INVESTORS.length, 'investor durations in range, ids unique');
ok(INVESTORS.some((item) => !item.cooldownMinutes) && INVESTORS.every((item) => item.trade ? item.trade.amount > 0 : investorProfit(item) > 0), 'cooldowns optional, every offer profits');
for (const currency of ['fish', 'diamonds'] as const) {
  const trader = INVESTORS.find((item) => item.trade?.currency === currency)!;
  const tr = newState();
  tr.superManagers = [true];
  tr.money = trader.cost;
  const done = trader.minutes * 60000;
  ok(startInvestment(tr, trader, 0) && tr.money === 0 && collectInvestment(tr, trader, done) && tr.money === 0 && tr.lifetime === 0 && tr[currency] === trader.trade!.amount && (currency === 'fish' || tr.diamondsFound === trader.trade!.amount), `trading money pays ${currency}, no money back`);
}
const invOld = load(JSON.stringify({ money: 5, biz: newState().biz }));
ok(Object.keys(invOld.investments).length === 0 && invOld.superManagers.length === 0 && invOld.giftedAngels === 0, 'old saves load with no investments');
ok(parseSaveData(JSON.stringify({ biz: newState().biz, investments: { penny: { readyAt: 'soon' } } })) === undefined, 'bad investment data is rejected');
const invAsc = newState();
invAsc.superManagers = [true, true];
invAsc.money = fast.cost;
startInvestment(invAsc, fast, 0);
invAsc.lifetime = lifetimeForAngels(10);
ok(Object.keys(ascend(invAsc).investments).length === 0 && investorsOpen(ascend(invAsc)), 'ascending cancels investments, keeps the tab');

// rebalance: upgrades cheaper, super managers dearer and rising, every upgrade within the late game's reach
ok(UPGRADES[0].cost < 600e3 && UPGRADES.every((u) => u.cost <= 1e44), 'upgrades cost less than before');
ok(SUPER_MANAGERS[0].cost === 1e9 && SUPER_MANAGERS[9].cost === 60e18 && SUPER_MANAGERS.every((m, i) => !i || m.cost > SUPER_MANAGERS[i - 1].cost), 'super managers are pricier and rise steadily');
console.log('investor and rebalance checks ok');

// listed cats (Diamond or Golden Fish) are never handed out by luck, and fish cats cost fish
{
  const { FISH_CATS } = await import('./data/cats.ts');
  const { buyListedCat, catListing, randomUndiscoveredCat } = await import('./collection.ts');
  const lucky = newState();
  for (let i = 0; i < 500; i++) {
    const cat = randomUndiscoveredCat(lucky);
    if (!cat) break;
    ok(!catListing(cat.breed, cat.coat), 'random cats are never listed cats');
    lucky.cats.push(cat);
  }
  const fishShopper = newState();
  const fishListing = FISH_CATS[0];
  fishShopper.fish = fishListing.price;
  ok(buyListedCat(fishShopper, fishListing.breed, fishListing.coat) !== undefined && fishShopper.fish < fishListing.price + 10, 'fish cats are bought with Golden Fish');
  console.log('listed cat checks ok');
}
