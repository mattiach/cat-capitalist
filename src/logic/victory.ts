import { AWARDS } from './awards.ts';
import { undiscoveredCatCombos } from './collection.ts';
import { ownsEveryAccessory } from './data/accessories.ts';
import { PERMANENT_UPGRADES } from './data/permanentUpgrades.ts';
import { SUPER_MANAGERS } from './data/superManagers.ts';
import { UPGRADES } from './data/upgrades.ts';
import { MUSIC_TRACKS, ownsTrack } from './music.ts';
import type { State } from './state.ts';

const all = (list: unknown[], owned: (boolean | undefined)[]) => list.every((_, k) => owned[k]);

/** Everything unlocked and bought: every cat, manager, upgrade, accessory (Specials aside), song and award. */
export const isVictory = (s: State) =>
  !undiscoveredCatCombos(s).length &&
  s.biz.every((b) => b.manager) && all(UPGRADES, s.upgrades) && all(SUPER_MANAGERS, s.superManagers) &&
  all(PERMANENT_UPGRADES, s.permanentUpgrades) && ownsEveryAccessory(s.accessories) && all(AWARDS, s.awards) &&
  MUSIC_TRACKS.every((track) => ownsTrack(s, track));
