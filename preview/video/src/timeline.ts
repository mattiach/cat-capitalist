// The film is cut to the soundtrack (scripts/copy-assets.mjs picks it): every
// cut lands on a beat. Measured from the track: ~110 BPM, the band comes in at
// 5.88 s, and an intro hit lands at 2.95 s.
export const FPS = 30;

/** Frames per beat. */
export const BEAT = 0.5455 * FPS;
/** Frame the band comes in: the first cut, out of the opening. */
const BAND_IN = 5.88 * FPS;
/** Frame of the intro hit, used by the opening. */
export const INTRO_HIT = Math.round(2.95 * FPS);

// Every scene after the opening, in film order, as its length in beats.
const beats = {
  intro: 8,
  businesses: 12,
  managers: 8,
  cattery: 8,
  boutique: 8,
  victory: 8,
  heaven: 12,
  closing: 12,
} as const;

export type SceneId = "opening" | keyof typeof beats;

// Global frame of every cut, rounded from the beat grid so drift never adds up.
const ids = Object.keys(beats) as (keyof typeof beats)[];
const cuts = [0];
let beat = 0;
for (const id of ids) {
  cuts.push(Math.round(BAND_IN + beat * BEAT));
  beat += beats[id];
}
cuts.push(Math.round(BAND_IN + beat * BEAT));

const order: SceneId[] = ["opening", ...ids];
export const scenes = Object.fromEntries(
  order.map((id, i) => [id, cuts[i + 1] - cuts[i]])
) as Record<SceneId, number>;

/** Frame within a scene of its nth beat; beat 0 is the cut into it. */
export const onBeat = (n: number) => Math.round(n * BEAT);

export const TOTAL_FRAMES = cuts[cuts.length - 1];
