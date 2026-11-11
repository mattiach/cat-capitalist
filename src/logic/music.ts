import TRACKS from './data/music.json' with { type: 'json' };
import { shopFactor } from './data/permanentUpgrades.ts';
import { spend, type State } from './state.ts';

/** `price` is in money. `gain` (0-1) evens out how loud the recordings are, so switching doesn't jump in volume. */
export type Track = { title: string; fileName: string; price?: number; gain?: number };

/** Saves refer to tracks by file name, so the list can be reordered or extended freely. */
export const MUSIC_TRACKS: Track[] = TRACKS;
const DEFAULT_TRACK_PRICE = 5000;
export const VOLUME_STEP = 0.1;

const track = (fileName: string) => MUSIC_TRACKS.find((item) => item.fileName === fileName);

/** Price in money. The first track is always free, so there is always something to play. */
export const trackPrice = (item: Track) => (item === MUSIC_TRACKS[0] ? 0 : item.price ?? DEFAULT_TRACK_PRICE);
/** What the player actually pays, after Boutique and Music Store discounts. */
export const trackCost = (s: State, item: Track) => Math.ceil(trackPrice(item) * shopFactor(s));
export const ownsTrack = (s: State, item: Track) => trackPrice(item) === 0 || s.musicOwned.includes(item.fileName);

/** The selected track while it is still listed and owned, otherwise the free default. */
export function currentTrack(s: State): Track | undefined {
  const selected = s.musicSelected === null ? undefined : track(s.musicSelected);
  return selected && ownsTrack(s, selected) ? selected : MUSIC_TRACKS[0];
}

export function buyTrack(s: State, fileName: string) {
  const item = track(fileName);
  if (!item || ownsTrack(s, item) || !spend(s, trackCost(s, item))) return false;
  s.musicOwned.push(fileName);
  return true;
}

export function selectTrack(s: State, fileName: string) {
  const item = track(fileName);
  if (!item || !ownsTrack(s, item)) return false;
  s.musicSelected = fileName;
  s.musicOn = true;
  return true;
}

/**
 * Steps through owned tracks, wrapping around, and selects the result. With shuffle on, going forward
 * picks another owned track at random. `skip` holds tracks that can't play.
 */
export function stepTrack(s: State, dir: 1 | -1, skip?: ReadonlySet<string>, rand = Math.random) {
  const owned = MUSIC_TRACKS.filter((item) => ownsTrack(s, item) && !skip?.has(item.fileName));
  const current = currentTrack(s);
  const others = owned.filter((item) => item !== current);
  const from = owned.findIndex((item) => item === current);
  const next = s.musicShuffle && dir === 1
    ? others[Math.floor(rand() * others.length)] ?? owned[0]
    : owned[(from + dir + owned.length) % owned.length];
  return next ? selectTrack(s, next.fileName) : false;
}

export function toggleMusic(s: State) {
  s.musicOn = !s.musicOn;
}

/** Moves a volume by whole steps and keeps it clean: 0-1, without float dust like 0.30000000000000004. */
export function changeVolume(s: State, which: 'musicVolume' | 'sfxVolume', steps: number) {
  s[which] = Math.min(1, Math.max(0, Math.round((s[which] + steps * VOLUME_STEP) * 10) / 10));
}
