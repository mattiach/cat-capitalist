/**
 * Sound effect catalog: what each game event sounds like. Files live in public/sounds/.
 *
 * The jingle packs share their melodies across instruments (02 and 10 rise, 01 and 14 fall), so rewards use rising
 * melodies only and escalate by instrument: Pizzicato for everyday rewards, Steel drums for the big moments.
 * Steel and Sax also sit well with the reggae soundtrack; the 8-bit Zoomies jingle stands out on purpose.
 */
const PIZZICATO = 'Pizzicato jingles/jingles_PIZZI';
const STEEL = 'Steel jingles/jingles_STEEL';
const SAX = 'Sax jingles/jingles_SAX';
const NES = '8-Bit jingles/jingles_NES';

/** How much an event matters. Higher tiers are louder and win when jingles would collide. */
export type Tier = 'subtle' | 'medium' | 'rewarding' | 'special';
export const TIERS: Record<Tier, { rank: number; volume: number; cooldownMs: number }> = {
  subtle: { rank: 0, volume: 0.3, cooldownMs: 50 },
  medium: { rank: 1, volume: 0.45, cooldownMs: 80 },
  rewarding: { rank: 2, volume: 0.6, cooldownMs: 900 },
  special: { rank: 3, volume: 0.75, cooldownMs: 0 },
};

type CueSpec = { files: string[]; tier: Tier; volume?: number; cooldownMs?: number };

export const CUES = {
  // UI
  click: { files: ['click_002.ogg', 'click_003.ogg'], tier: 'subtle' },
  tab: { files: ['select_001.ogg', 'select_002.ogg'], tier: 'subtle' },
  tick: { files: ['tick_001.ogg', 'tick_002.ogg'], tier: 'subtle' },
  toggle: { files: ['toggle_001.ogg', 'toggle_002.ogg'], tier: 'subtle' },
  select: { files: ['select_007.ogg'], tier: 'subtle' },
  panelOpen: { files: ['maximize_008.ogg'], tier: 'subtle', volume: 0.25 },
  panelClose: { files: ['minimize_008.ogg'], tier: 'subtle', volume: 0.25 },
  error: { files: ['error_004.ogg', 'error_008.ogg'], tier: 'medium', volume: 0.35, cooldownMs: 250 },
  // Economy
  collect: { files: ['glass_005.ogg', 'glass_006.ogg'], tier: 'subtle', cooldownMs: 120 },
  buy: { files: ['pluck_001.ogg', 'pluck_002.ogg'], tier: 'medium', volume: 0.4 },
  purchase: { files: ['confirmation_003.ogg'], tier: 'medium' },
  confirm: { files: ['confirmation_001.ogg'], tier: 'medium', volume: 0.35 },
  coin: { files: ['confirmation_002.ogg'], tier: 'medium', volume: 0.35 },
  unlock: { files: ['maximize_007.ogg'], tier: 'medium', volume: 0.3, cooldownMs: 20000 },
  unlockBusiness: { files: [`${SAX}08.ogg`], tier: 'rewarding', volume: 0.85 },
  hire: { files: [`${SAX}10.ogg`], tier: 'rewarding', volume: 0.85 },
  milestone: { files: [`${PIZZICATO}08.ogg`], tier: 'rewarding', volume: 0.5, cooldownMs: 1500 },
  // Cats and collection
  equip: { files: ['drop_002.ogg', 'drop_003.ogg'], tier: 'medium', volume: 0.4 },
  favorite: { files: ['bong_001.ogg'], tier: 'medium', volume: 0.35 },
  catCommon: { files: [`${PIZZICATO}15.ogg`], tier: 'rewarding', volume: 0.5 },
  catRare: { files: [`${PIZZICATO}02.ogg`], tier: 'rewarding' },
  catEpic: { files: [`${STEEL}10.ogg`], tier: 'special', volume: 0.6 },
  catLegendary: { files: [`${STEEL}06.ogg`], tier: 'special' },
  // Progression
  fish: { files: [`${PIZZICATO}13.ogg`], tier: 'rewarding', volume: 0.45, cooldownMs: 1500 },
  award: { files: [`${PIZZICATO}10.ogg`], tier: 'rewarding', cooldownMs: 1500 },
  rare: { files: [`${STEEL}13.ogg`], tier: 'rewarding', volume: 0.65 },
  diamond: { files: [`${STEEL}15.ogg`], tier: 'special', volume: 0.65 },
  permanent: { files: [`${STEEL}08.ogg`], tier: 'rewarding', volume: 0.65 },
  musicBuy: { files: [`${SAX}02.ogg`], tier: 'rewarding', volume: 0.85 },
  ascend: { files: [`${STEEL}02.ogg`], tier: 'special', volume: 0.85 },
  // Special events
  notify: { files: ['glass_002.ogg'], tier: 'subtle' },
  stray: { files: [`${PIZZICATO}06.ogg`], tier: 'rewarding', volume: 0.5 },
  zoomies: { files: [`${NES}12.ogg`], tier: 'rewarding', volume: 0.4 },
} satisfies Record<string, CueSpec>;

export type Cue = keyof typeof CUES;
export const cueSpec = (cue: Cue): CueSpec => CUES[cue];
