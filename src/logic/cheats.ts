import { AWARDS } from './awards.ts';
import { ACCESSORIES, isPremiumAccessory } from './data/accessories.ts';
import { BREEDS, COATS } from './data/cats.ts';
import { MAX_BUSINESS_LEVEL, MILESTONES } from './data/businesses.ts';
import { UPGRADES } from './data/upgrades.ts';
import { catName } from './collection.ts';
import { MUSIC_TRACKS } from './music.ts';
import { zoomiesDuration } from './economy.ts';
import { lifetimeForAngels, minAscendClaim } from './prestige.ts';
import { syncUnlocks } from './unlocks.ts';

import type { Cat, State } from './state.ts';

type CheatResult = { ok: boolean; message: string; cat?: Cat };
type Cheat = { code: string; reward: string; apply: (s: State) => CheatResult };

const unlockEverything = (s: State): CheatResult => {
  s.cheatsUnlocked = true;
  s.money += 1e9;
  // Super managers and permanent bonuses stay locked on purpose.
  s.musicOwned = MUSIC_TRACKS.map((track) => track.fileName);
  s.lifetime = Math.max(s.lifetime, lifetimeForAngels(s.angels - s.giftedAngels + minAscendClaim(s)));
  let milestoneFish = 0;
  const maxBusinessLevel = MAX_BUSINESS_LEVEL;
  s.biz.forEach((business, i) => {
    business.owned = Math.max(business.owned, maxBusinessLevel);
    business.manager = true;
    const previousBest = s.best[i] ?? 0;
    milestoneFish += MILESTONES.filter((milestone) => milestone > previousBest && milestone <= business.owned).length;
    s.best[i] = Math.max(previousBest, business.owned);
  });
  s.upgrades = UPGRADES.map(() => true);
  s.accessories = ACCESSORIES.map(() => true);
  BREEDS.forEach((_, breed) => COATS.forEach((_, coat) => {
    if (!s.cats.some((cat) => cat.breed === breed && cat.coat === coat)) {
      s.cats.push({ breed, coat, head: -1, face: -1, neck: -1 });
    }
  }));
  let awardFish = 0;
  s.awards = AWARDS.map((award, i) => {
    if (s.awards[i]) return true;
    awardFish += award.fish;
    return true;
  });
  s.fish += awardFish + milestoneFish;
  s.ascensions = Math.max(s.ascensions, 1);
  // Everything just unlocked at once: tagging all of it NEW would only be noise.
  syncUnlocks(s, 'seen');
  return { ok: true, message: `LION redeemed: all businesses maxed at ${MAX_BUSINESS_LEVEL}, every manager hired, all ${UPGRADES.length} upgrades purchased, all accessories, music, cats and awards unlocked, plus $1 B!` };
};

export const CHEATS: Cheat[] = [
  {
    code: 'MONEY', reward: '+$100,000', apply: (s) => {
      s.money += 100_000;
      s.lifetime += 100_000;
      return {
        ok: true, message: 'Ok, that was an easy one... +$100,000!'
      };
    },
  },
  {
    code: 'GOLDENFISH', reward: '+10 Golden Fish', apply: (s) => {
      s.fish += 10;
      return { ok: true, message: 'GOLDENFISH redeemed: +10 Golden Fish!' };
    },
  },
  {
    code: 'ZOOMIES', reward: 'Better together, paws close and hearts closer!', apply: (s) => {
      const duration = zoomiesDuration(s);
      s.boost = Math.max(s.boost, duration);
      return { ok: true, message: `ZOOMIES redeemed: ${duration}s of Zoomies!` };
    },
  },
  {
    code: 'MEOW', reward: 'A random locked accessory', apply: (s) => {
      const locked = ACCESSORIES.map((accessory, i) => ({ accessory, i })).filter(({ accessory, i }) => !s.accessories[i] && !isPremiumAccessory(accessory));
      if (!locked.length) return { ok: false, message: 'No locked accessories remain. MEOW was still redeemed.' };
      const { accessory, i } = locked[Math.floor(Math.random() * locked.length)];
      s.accessories[i] = true;
      return { ok: true, message: `MEOW redeemed: you unlocked ${accessory.name}!` };
    },
  },
  {
    code: "CAT", reward: 'A random locked cat', apply: (s) => {
      const locked = BREEDS.flatMap((_, breed) => COATS.map((_, coat) => ({ breed, coat }))).filter(({ breed, coat }) => !s.cats.some((cat) => cat.breed === breed && cat.coat === coat));
      if (!locked.length) return { ok: false, message: 'No locked cats remain. CAT was still redeemed.' };
      const { breed, coat } = locked[Math.floor(Math.random() * locked.length)];
      const cat = { breed, coat, head: -1, face: -1, neck: -1 };
      s.cats.push(cat);
      return { ok: true, message: `CAT redeemed: you unlocked a ${catName(cat)}!`, cat };
    },
  },
  { code: 'LION', reward: 'Everything unlocked + $1 B', apply: unlockEverything },
];

export function redeemCheat(s: State, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, redeemed: false, message: 'Enter a cheat code first.' };

  const cheat = CHEATS.find((item) => item.code === code);
  if (!cheat) return { ok: false, redeemed: false, message: 'That code is not recognized.' };
  if (s.redeemedCheats.includes(code)) return { ok: false, redeemed: false, message: 'You already used this code.' };

  const result = cheat.apply(s);
  s.redeemedCheats.push(code);
  return { ...result, redeemed: true };
}
