import Phaser from 'phaser';
import { ACCESSORIES, type Accessory } from '../../logic/data/accessories.ts';
import { BREEDS, COATS } from '../../logic/data/cats.ts';
import type { Cat } from '../../logic/state.ts';
import { luma, mix, shade } from './color.ts';
import { drawIcon, paintIcon } from './icons.ts';
import { pen, type Point } from './pen.ts';

const SPOTS = [[-0.45, -0.55], [0.4, -0.6], [0, -0.72], [-0.72, -0.1], [0.72, -0.05], [-0.6, 0.45], [0.6, 0.48], [0.18, -0.36], [-0.2, -0.4]];
const EARS = { normal: [0.25, -0.85, 0.9, -0.35, 0.8, -1.35], big: [0.2, -0.85, 0.98, -0.25, 0.95, -1.62], tufted: [0.25, -0.85, 0.9, -0.35, 0.82, -1.42] };
const rad = Phaser.Math.DegToRad;
/** Height of the eyes, as a fraction of the cat's radius. Glasses line up on it. */
const EYE_LINE = -0.08;
/**
 * Where accessories are worn, in head radii from the head's center (the head spans 1 each way, 0.9 up and down).
 * `size` is the drawing's radius; layers stack back, collar, wrap, glasses, hat, prop.
 */
type Spot = { x: number; y: number; size: number; angle?: number; layer: 'back' | 'collar' | 'wrap' | 'hat' | 'prop'; grounded?: boolean };
const SPOTS_WORN: Record<NonNullable<Accessory['placement']>, Spot> = {
  head: { x: 0, y: -1, size: 0.64, angle: -6, layer: 'hat' },
  neck: { x: 0, y: 0.98, size: 0.5, layer: 'collar' },
  wrap: { x: 0, y: 0, size: 1, layer: 'wrap' },
  back: { x: 0, y: 0.06, size: 1.8, layer: 'back' },
  ear: { x: -0.62, y: -0.78, size: 0.3, angle: -14, layer: 'prop' },
  mouth: { x: 0, y: 0.52, size: 0.4, angle: -6, layer: 'prop' },
  left: { x: -1.3, y: 0.24, size: 0.5, angle: -8, layer: 'prop' },
  right: { x: 1.3, y: 0.24, size: 0.5, angle: 8, layer: 'prop' },
  leftBottom: { x: -1.22, y: 0.5, size: 0.46, layer: 'prop', grounded: true },
  rightBottom: { x: 1.22, y: 0.5, size: 0.46, layer: 'prop', grounded: true },
};
/** Drawings made at the head's own size get thinner strokes, to match the hats and props drawn smaller. */
const WRAP_LINE = 0.62;

export type Eyes = 'open' | 'half' | 'closed' | 'happy' | 'wide';
export type Mouth = 'neutral' | 'smile' | 'open' | 'yawn' | 'blep';
export type FaceState = {
  eyes: Eyes;
  mouth: Mouth;
  blush: boolean;
  /** Where the pupils point, each axis -1..1. */
  gazeX: number;
  gazeY: number;
  /** Pupil width: 1 = slit, ~2 = round. */
  pupil: number;
};
export type Face = { state: FaceState; set: (changes: Partial<FaceState>) => void };

/** Half of the walking cat's outline, in pixels. The head's outline uses it too, so both read as one line. */
const WALK_OUTLINE = 1.2;
/** Paws travel this far per step, in pixels. */
const STRIDE = 20;
/**
 * Milliseconds per full step of all four legs. Exact ground contact at the callers' ~87px/s would need ~380ms,
 * which reads as a frantic scurry, so planted paws slip a little in exchange for a relaxed walk.
 */
const WALK_CYCLE = 560;
const GROUND = 27;
const TORSO: Point[] = [[-20, -20], [-8, -11], [6, -10.5], [20, -11.5], [29, -6], [30, 3], [20, 8.5], [6, 11], [-10, 11.5], [-21, 8], [-27, -2], [-28, -14]];
const FLANK_SPOTS = [[-8, -5], [3, -7], [14, -6], [23, -2], [-3, 2], [9, 3], [19, 4]];

/** Samples a smooth curve through the points. A curve whose last point repeats its first comes out as a closed loop. */
const curve = (points: Point[], steps: number, from = 0, to = 1): Point[] => {
  const xs = points.map(([px]) => px);
  const ys = points.map(([, py]) => py);
  return Array.from({ length: steps + 1 }, (_, k): Point => {
    const t = from + ((to - from) * k) / steps;
    return [Phaser.Math.Interpolation.CatmullRom(xs, t), Phaser.Math.Interpolation.CatmullRom(ys, t)];
  });
};

/** A limb's outline: a smooth curve through `spine`, `halfWidth(t)` wide on each side at t = 0..1 along it. */
const ribbon = (spine: Point[], halfWidth: (t: number) => number, from = 0, to = 1): Point[] => {
  const steps = 12;
  const line = curve(spine, steps, from, to);
  const sides = line.map(([px, py], k): [Point, Point] => {
    const [ax, ay] = line[Math.max(0, k - 1)];
    const [bx, by] = line[Math.min(steps, k + 1)];
    const length = Math.hypot(bx - ax, by - ay) || 1;
    const w = halfWidth(from + ((to - from) * k) / steps);
    return [[px - ((by - ay) / length) * w, py + ((bx - ax) / length) * w], [px + ((by - ay) / length) * w, py - ((bx - ax) / length) * w]];
  });
  return [...sides.map(([left]) => left), ...sides.map(([, right]) => right).reverse()];
};

const blob = (cx: number, cy: number, rx: number, ry: number): Point[] =>
  Array.from({ length: 14 }, (_, k): Point => [cx + Math.cos((k / 14) * Math.PI * 2) * rx, cy + Math.sin((k / 14) * Math.PI * 2) * ry]);

/** Where a paw is relative to its resting spot, `u` = 0..1 through its step: planted and sliding back, then lifted and swung forward. */
const pawAt = (u: number): Point => {
  if (u < 0.6) return [STRIDE * (u / 0.6 - 0.5), 0];
  const k = (u - 0.6) / 0.4;
  return [STRIDE * (0.5 - k * k * (3 - 2 * k)), -Math.sin(Math.PI * k) * 5];
};

/** The joint between two points `length` apart in total, pushed out sideways by `bend` (+1 = toward the tail) as the limb folds. */
const jointBetween = ([ax, ay]: Point, [bx, by]: Point, length: number, bend: number): Point => {
  const reach = Math.hypot(bx - ax, by - ay) || 1;
  const out = Math.sqrt(Math.max(0, (length / 2) ** 2 - (reach / 2) ** 2)) * bend;
  return [(ax + bx) / 2 + (-(by - ay) / reach) * -out, (ay + by) / 2 + ((bx - ax) / reach) * -out];
};

/**
 * A whole cat walking left, with its usual head turned toward the viewer. Used for the strays crossing the screen.
 * One clock poses the whole body, so legs, back, tail and head stay in step. Torso, near legs and tail share a
 * single silhouette: every outline is stroked first and every fill goes on top, which hides the seams between them.
 */
export function drawWalkingCat(scene: Phaser.Scene, x: number, y: number, cat: Cat) {
  const breed = BREEDS[cat.breed];
  const fur = breed.hairless ? mix(COATS[cat.coat].color, 0xf0b8a8, 0.55) : COATS[cat.coat].color;
  const dark = shade(fur, luma(fur) > 0.8 ? 0.72 : 0.62);
  const edge = shade(fur, 0.58);
  const farFur = shade(fur, 0.8);
  const girth = (1 + ((breed.wide ?? 1) - 1) * 0.8) * (breed.fluffy ? 1.1 : 1);
  const torso = TORSO.map(([px, py]): Point => [px, py * girth]);
  const torsoShape = curve([...torso, torso[0]], 48).slice(0, -1);
  const tailWidth = breed.fluffy ? 5.4 : breed.hairless ? 2.4 : 3.4;
  // Only the chest and rump: a row of tufts along the belly reads as udders.
  // Scaled with the torso and kept mostly inside it, or the chest tuft bulges out as a lump under the head.
  const ruff = breed.fluffy ? [[-22, 2 * girth, 6.5], [27, 3 * girth, 5.5]] : [];

  const body = scene.add.graphics();
  const p = pen(body, 40); // 40 is the smallest radius where glow keeps all its layers; fewer show up as visible rings
  const { container: head, face } = buildCat(scene, -24, -20, 15, cat, WALK_OUTLINE);
  face.set({ gazeX: -0.6 }); // looking where it's going

  const trace = (shape: Point[]) => {
    body.beginPath();
    shape.forEach(([px, py], k) => (k ? body.lineTo(px, py) : body.moveTo(px, py)));
    body.closePath();
  };
  const silhouette = (shapes: Point[][], color: number) => {
    body.lineStyle(WALK_OUTLINE * 2, edge);
    shapes.forEach((shape) => {
      trace(shape);
      body.strokePath();
    });
    body.fillStyle(color);
    shapes.forEach((shape) => {
      trace(shape);
      body.fillPath();
    });
  };
  const paintOn = (shape: Point[], color: number, alpha = 1) => {
    body.fillStyle(color, alpha);
    trace(shape);
    body.fillPath();
  };

  const socks = (spine: Point[], taper: (t: number) => number) => {
    const [px, py] = spine[spine.length - 1];
    paintOn(ribbon(spine, taper, 0.6), dark);
    paintOn(blob(px - 1, py, 3.6, 2.5), dark);
  };

  /** Controls for one leg. Front legs bend back at the elbow; hind legs bend forward at the knee and back at the hock. */
  const legSpine = (hip: Point, restX: number, ground: number, u: number, hind: boolean): Point[] => {
    const [dx, lift] = pawAt(u);
    const paw: Point = [restX + dx, ground + lift - 2];
    if (!hind) return [hip, jointBetween(hip, paw, 24, 1), paw];
    const hock: Point = [paw[0] + 4, paw[1] - 8];
    return [hip, jointBetween(hip, hock, 21, -1), hock, paw];
  };
  const leg = (spine: Point[], hind: boolean) => {
    const [px, py] = spine[spine.length - 1];
    const taper = (t: number) => (hind ? 2.3 + 4.7 * (1 - t) ** 2 : 2.5 + 2.4 * (1 - t));
    return { spine, taper, shapes: [ribbon(spine, taper), blob(px - 1, py, 3.6, 2.5)] };
  };

  const pose = (clock: number) => {
    const phase = clock % 1;
    const bob = Math.cos(phase * Math.PI * 4) * 0.7; // the back dips twice per cycle, once per pair of legs
    const pitch = Math.sin(phase * Math.PI * 2) * 0.008;
    const lift = (px: number) => bob + pitch * Math.max(0, px) * 0.65;
    const at = ([px, py]: Point): Point => [px, py + bob + pitch * px * 0.65];

    // A walk's footfall order: hind, then front on the same side, then the same on the far side.
    const farFront = leg(legSpine(at([-10, 3]), -11, GROUND - 1.5, (phase + 0.75) % 1, false), false);
    const farHind = leg(legSpine(at([15, 1]), 16, GROUND - 1.5, (phase + 0.5) % 1, true), true);
    const nearFront = leg(legSpine(at([-15, 4]), -17, GROUND, (phase + 0.25) % 1, false), false);
    const nearHind = leg(legSpine(at([20, 2]), 21, GROUND, phase, true), true);

    // The wave runs from base to tip, and at half the step rate so the tail stays lazy.
    const wave = clock * Math.PI;
    const tailSpine = [0, 0.25, 0.5, 0.75, 1].map((t): Point => [
      27 + 19 * Math.sin(t * 1.9) + Math.sin(wave - t * 2.4) * 4 * t,
      -3 - 30 * t + 7 * t * t * t + Math.cos(wave - t * 2.4) * 1.4 * t + lift(27),
    ]);
    const tailTaper = (t: number) => tailWidth * (1 - 0.4 * t) * Math.min(1, Math.sqrt((1 - t) * 10));

    body.clear();
    silhouette([...farFront.shapes, ...farHind.shapes], farFur);
    if (breed.pattern === 'points') for (const { spine, taper } of [farFront, farHind]) socks(spine, taper);
    silhouette([
      ribbon(tailSpine, tailTaper),
      ...nearFront.shapes,
      ...nearHind.shapes,
      torsoShape.map(at),
      ...ruff.map(([px, py, size]) => blob(px, py + lift(px), size, size)),
    ], fur);

    // Soft light along the back, shade under the belly, as on the head. Both stay well inside the torso.
    p.glow(0.05, -0.1125 + lift(2) / 40, 1, 0.225, 0xffffff, breed.hairless ? 0.26 : 0.2, 8);
    p.glow(0.025, 0.1625 + lift(1) / 40, 1.1, 0.1875, shade(fur, 0.62), 0.3, 8);
    p.glow(0.55, 0.025 + lift(22) / 40, 0.325, 0.375, 0xffffff, 0.08, 8); // haunch

    if (breed.pattern === 'tabby') {
      for (const sx of [-8, 2, 12, 22]) paintOn(ribbon(([[sx, -10.5], [sx + 1, -5], [sx - 0.5, 0]] as Point[]).map(at), (t) => 1.4 * (1 - t) + 0.2), dark, 0.85);
      for (const from of [0.5, 0.72]) paintOn(ribbon(tailSpine, tailTaper, from, from + 0.1), dark);
    }
    if (breed.pattern === 'spots') FLANK_SPOTS.forEach(([sx, sy], k) => paintOn(blob(sx, sy + lift(sx), 1.9 + (k % 3) * 0.3, 1.3 + (k % 3) * 0.2), dark));
    if (breed.pattern === 'wrinkles') {
      for (const sy of [-3, 0, 3]) paintOn(ribbon(([[-14, sy], [-9, sy + 1.6], [-4, sy]] as Point[]).map(at), () => 0.45), dark, 0.6);
    }
    if (breed.pattern === 'points') {
      // Siamese color: dark socks and tail, matching the ears and mask.
      paintOn(ribbon(tailSpine, tailTaper, 0.3), dark);
      for (const { spine, taper } of [nearFront, nearHind]) socks(spine, taper);
    }

    head.setPosition(-24, -20 + bob * 0.4).setAngle(pitch * 20);
  };

  const walker = scene.add.container(x, y, [body, head]).setSize(96, 72);
  pose(0.1);
  if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const clock = { value: 0 };
    const walking = scene.tweens.add({ targets: clock, value: 2, duration: WALK_CYCLE * 2, repeat: -1, ease: 'Linear', onUpdate: () => pose(clock.value) });
    walker.once(Phaser.GameObjects.Events.DESTROY, () => walking.remove());
  }
  return walker;
}

/**
 * An Angel Cat: the game's real cat portrait, blissfully happy, with feathered wings and a glowing halo.
 * Its r is the head's radius; wings reach about 2.2r sideways and the halo about 1.8r above.
 */
export function drawAngelCat(scene: Phaser.Scene, x: number, y: number, r: number) {
  const light = scene.add.graphics();
  pen(light, r).glow(0, -0.2, 4.6, 4, 0xfff1b8, 0.34, 10);
  const wing = (side: number) => {
    const part = scene.add.graphics({ x: side * 0.72 * r, y: 0.22 * r });
    const p = pen(part, r);
    const aim = (angle: number) => (side > 0 ? angle : 180 - angle);
    // Real wing shape: long flight feathers sweep up and out, shorter ones overlap them near the shoulder.
    for (const [angle, length] of [[-68, 1.9], [-52, 2], [-36, 1.86], [-20, 1.62], [-4, 1.34], [12, 1.04]]) p.leaf(0, 0, aim(angle), length, 0.2, 0xeef2fb);
    for (const [angle, length] of [[-60, 1.2], [-40, 1.18], [-20, 1.02], [0, 0.82]]) p.leaf(0, 0, aim(angle), length, 0.17, 0xffffff);
    return part;
  };
  const wings = [wing(-1), wing(1)];
  const { container: head, face } = buildCat(scene, 0, 0, r, { breed: 1, coat: 2, head: -1, face: -1, neck: -1 });
  face.set({ eyes: 'happy', mouth: 'smile', blush: true });
  const halo = scene.add.graphics({ y: -1.62 * r });
  const ringPen = pen(halo, r);
  ringPen.glow(0, 0, 1.9, 0.86, 0xffe28a, 0.5, 8);
  ringPen.ring(0, 0, 1.16, 0.36, 0xd9962a, 2.2);
  ringPen.ring(0, 0, 1.16, 0.36, 0xffe28a, 1.2);
  const angel = scene.add.container(x, y, [light, ...wings, head, halo]);
  if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const moving = [
      scene.tweens.add({ targets: angel, y: y - r * 0.08, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.InOut' }),
      scene.tweens.add({ targets: wings, scaleY: 0.94, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' }),
      scene.tweens.add({ targets: halo, y: -1.7 * r, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut' }),
    ];
    angel.once(Phaser.GameObjects.Events.DESTROY, () => moving.forEach((tween) => tween.remove()));
  }
  return angel;
}

/** Static cat portrait of radius r centered at (x, y). */
export const drawCat = (scene: Phaser.Scene, x: number, y: number, r: number, cat: Cat) => buildCat(scene, x, y, r, cat).container;

/**
 * Draws a cat face (breed = shape & pattern, coat = color) and returns a `face` controller
 * that redraws eyes, mouth and blush for expressions.
 * `outline` swaps the portrait's soft rim for one solid line that many pixels wide, for a head joined to a drawn body.
 */
export function buildCat(scene: Phaser.Scene, x: number, y: number, r: number, cat: Cat, outline?: number): { container: Phaser.GameObjects.Container; face: Face } {
  const breed = BREEDS[cat.breed];
  const fur = breed.hairless ? mix(COATS[cat.coat].color, 0xf0b8a8, 0.55) : COATS[cat.coat].color;
  const dark = shade(fur, luma(fur) > 0.8 ? 0.72 : 0.62);
  const light = mix(fur, 0xffffff, 0.55);
  const wide = breed.wide ?? 1;
  const g = scene.add.graphics();
  const p = pen(g, r);
  const line = Math.max(1.25, r * 0.035);

  if (breed.fluffy) {
    g.fillStyle(shade(fur, 0.84));
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      const puff = r * (k % 3 === 0 ? 0.2 : 0.16);
      g.fillCircle(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.82 + r * 0.1, puff);
    }
  }

  if (breed.ears !== 'folded') {
    const [ax, ay, bx, by, tx, ty] = EARS[breed.ears];
    for (const side of [-1, 1]) {
      const X = (v: number) => v * side * wide;
      p.poly([[X(ax), ay], [X(bx), by], [X(tx), ty]], breed.pattern === 'points' ? dark : fur, dark);
      // inner ear: same triangle shrunk toward its center, fading into the fur
      const mx = (ax + bx + tx) / 3;
      const my = (ay + by + ty) / 3;
      const s = (v: number, m: number) => m + (v - m) * 0.55;
      p.poly([[X(s(ax, mx)), s(ay, my)], [X(s(bx, mx)), s(by, my)], [X(s(tx, mx)), s(ty, my)]], 0xffb3c1);
    }
  }

  // A soft shadow rim keeps the head readable against similarly colored backgrounds.
  if (outline === undefined) {
    g.fillStyle(shade(fur, 0.58), 0.28).fillEllipse(0, 0, r * 2 * wide + line * 4, r * 1.8 + line * 4);
    g.fillStyle(shade(fur, 0.58), 0.7).fillEllipse(0, 0, r * 2 * wide + line * 1.6, r * 1.8 + line * 1.6);
  } else {
    g.fillStyle(shade(fur, 0.58)).fillEllipse(0, 0, r * 2 * wide + outline * 2, r * 1.8 + outline * 2);
  }
  g.fillStyle(fur).fillEllipse(0, 0, r * 2 * wide, r * 1.8);
  // Soft light from above and shade underneath give the head some roundness.
  p.glow(-0.06, -0.42, 1.3 * wide, 0.74, 0xffffff, breed.hairless ? 0.26 : 0.2);
  p.glow(0, 0.56, 1.5 * wide, 0.62, shade(fur, 0.62), 0.3);

  if (breed.ears === 'folded') {
    for (const side of [-1, 1]) p.poly([[side * 0.28, -0.9], [side * 0.85, -0.72], [side * 0.62, -0.5]], shade(fur, 0.8), shade(fur, 0.62));
  }

  g.fillStyle(dark);
  if (breed.pattern === 'tabby') {
    for (const dx of [-0.22, 0, 0.22]) {
      const width = dx ? 0.075 : 0.09;
      g.fillRoundedRect(dx * r - width * r / 2, -0.82 * r, width * r, (dx ? 0.28 : 0.38) * r, width * r / 2);
    }
    for (const side of [-1, 1]) {
      for (const dy of [0.02, 0.2]) {
        const sx = side * 0.7 * r * wide;
        g.fillRoundedRect(sx - 0.13 * r, dy * r, 0.26 * r, 0.075 * r, 0.04 * r);
      }
      g.lineStyle(line * 0.7, dark, 0.8)
        .lineBetween(side * 0.18 * r, -0.62 * r, side * 0.34 * r, -0.48 * r)
        .lineBetween(side * 0.34 * r, -0.48 * r, side * 0.47 * r, -0.6 * r);
    }
  }
  if (breed.pattern === 'spots') SPOTS.forEach(([sx, sy], k) => {
    const spot = (0.07 + (k % 3) * 0.015) * r;
    g.fillStyle(dark).fillEllipse(sx * r, sy * r, spot * 2.1, spot * 1.4);
    g.fillStyle(light, 0.55).fillCircle((sx - 0.025) * r, (sy - 0.02) * r, spot * 0.28);
  });
  if (breed.pattern === 'points') g.fillStyle(dark).fillEllipse(0, 0.2 * r, 1.2 * r, 1.25 * r); // mask fully contains the eyes
  if (breed.pattern === 'wrinkles') {
    g.lineStyle(line, dark, 0.6);
    for (let k = 0; k < 3; k++) g.beginPath().arc(0, 0.1 * r, (0.62 + 0.1 * k) * r, rad(245), rad(295)).strokePath();
    for (const side of [-1, 1]) {
      g.beginPath().arc(side * 0.38 * r, -0.08 * r, 0.2 * r, rad(side > 0 ? 205 : 335), rad(side > 0 ? 335 : 155)).strokePath();
    }
  }

  // Nose bridge, muzzle pads and whisker freckles add shape at small portrait sizes.
  g.lineStyle(line * 0.8, light, 0.45).lineBetween(0, 0.08 * r, 0, 0.22 * r);
  g.fillStyle(breed.pattern === 'points' ? shade(dark, 0.9) : light);
  g.fillCircle(-0.14 * r, 0.36 * r, 0.18 * r).fillCircle(0.14 * r, 0.36 * r, 0.18 * r);
  g.fillStyle(dark, 0.58);
  for (const side of [-1, 1]) {
    g.fillCircle(side * 0.16 * r, 0.34 * r, Math.max(0.8, r * 0.018));
    g.fillCircle(side * 0.22 * r, 0.4 * r, Math.max(0.8, r * 0.018));
  }
  p.poly([[-0.1, 0.2], [0.1, 0.2], [0, 0.33]], 0xff8fa3);
  g.lineStyle(Math.max(1, line * 0.65), 0xffd1d9, 0.8).lineBetween(-0.035 * r, 0.22 * r, 0.035 * r, 0.22 * r);
  g.lineStyle(Math.max(0.9, r * 0.02), luma(fur) > 0.6 ? 0x8a8196 : 0xffffff, 0.55);
  for (const side of [-1, 1]) {
    for (const k of [-1, 0, 1]) {
      const sy = (0.36 + k * 0.05) * r;
      const ex = side * 1.15 * wide * r;
      const ey = (0.3 + k * 0.14) * r;
      g.lineBetween(side * 0.3 * r, sy, side * 0.72 * wide * r, sy + (ey - sy) * 0.35)
        .lineBetween(side * 0.72 * wide * r, sy + (ey - sy) * 0.35, ex, ey);
    }
  }

  // expression layers, redrawn by face.set()
  const blush = scene.add.graphics().setVisible(false);
  blush.fillStyle(0xff7aa2, 0.4).fillEllipse(-0.55 * r, 0.16 * r, 0.26 * r, 0.14 * r).fillEllipse(0.55 * r, 0.16 * r, 0.26 * r, 0.14 * r);
  const eyes = scene.add.graphics();
  const mouth = scene.add.graphics();
  const around = breed.pattern === 'points' ? dark : fur; // what surrounds the eyes
  const lid = luma(around) > 0.35 ? shade(around, 0.45) : 0x120e16;
  const state: FaceState = { eyes: 'open', mouth: 'neutral', blush: false, gazeX: 0, gazeY: 0, pupil: 1 };

  const drawEyes = () => {
    eyes.clear().lineStyle(Math.max(1.5, r * 0.05), lid);
    for (const side of [-1, 1]) {
      const ex = side * 0.36 * r;
      const ey = EYE_LINE * r;
      if (state.eyes === 'closed') {
        eyes.beginPath().arc(ex, ey - 0.12 * r, 0.16 * r, rad(35), rad(145)).strokePath(); // relaxed ‿
        continue;
      }
      if (state.eyes === 'happy') {
        eyes.beginPath().arc(ex, ey + 0.1 * r, 0.14 * r, rad(215), rad(325)).strokePath(); // smiling ^
        continue;
      }
      const big = state.eyes === 'wide';
      const half = state.eyes === 'half';
      const w = (big ? 0.36 : 0.3) * r;
      const h = (half ? 0.16 : big ? 0.4 : 0.34) * r;
      const cy = half ? ey + 0.07 * r : ey;
      const pw = Math.min(w * 0.85, 0.1 * r * state.pupil);
      const ph = h * (state.pupil > 1.5 ? 0.62 : 0.82);
      const px = ex + state.gazeX * (w - pw) * 0.5;
      const py = cy + state.gazeY * (h - ph) * 0.5;
      eyes.fillStyle(lid).fillEllipse(ex, cy, w + line * 1.4, h + line * 1.4);
      eyes.fillStyle(breed.eyes).fillEllipse(ex, cy, w, h);
      eyes.fillStyle(0x111111).fillEllipse(px, py, pw, ph);
      eyes.fillStyle(0xffffff).fillCircle(px + 0.06 * r, py - (half ? 0.02 : 0.08) * r, 0.055 * r * (big ? 1.3 : 1));
      eyes.fillStyle(0xffffff, 0.8).fillCircle(px - 0.045 * r, py + 0.055 * r, 0.022 * r);
      if (half) eyes.lineBetween(ex - w / 2, cy - h / 2, ex + w / 2, cy - h / 2); // droopy lid
      if (big) eyes.lineStyle(line, lid, 0.85).lineBetween(ex - w * 0.46, cy - h * 0.62, ex + w * 0.42, cy - h * 0.72);
    }
  };

  const drawMouth = () => {
    const m = state.mouth;
    mouth.clear();
    if (m === 'open' || m === 'yawn') {
      const big = m === 'yawn';
      mouth.fillStyle(0x3a1f2b).fillEllipse(0, (big ? 0.5 : 0.43) * r, (big ? 0.26 : 0.14) * r, (big ? 0.3 : 0.14) * r);
      mouth.fillStyle(0xff8fa3).fillEllipse(0, (big ? 0.59 : 0.47) * r, (big ? 0.16 : 0.08) * r, (big ? 0.1 : 0.05) * r);
      return;
    }
    mouth.lineStyle(line, 0x3a2a3a, 0.8);
    if (m === 'smile') {
      for (const side of [-1, 1]) mouth.beginPath().arc(side * 0.07 * r, 0.33 * r, 0.07 * r, rad(0), rad(180)).strokePath(); // ω
      return;
    }
    mouth.lineBetween(0, 0.32 * r, -0.1 * r, 0.44 * r).lineBetween(0, 0.32 * r, 0.1 * r, 0.44 * r);
    if (m === 'blep') mouth.fillStyle(0xff6f91).fillRoundedRect(-0.07 * r, 0.37 * r, 0.14 * r, 0.18 * r, 0.06 * r);
  };

  const face: Face = {
    state,
    set(changes) {
      Object.assign(state, changes);
      drawEyes();
      if (changes.mouth) drawMouth();
      blush.setVisible(state.blush);
    },
  };
  drawEyes();
  drawMouth();

  // ---- accessories: each one goes to its spot and its layer ----
  const layers: Record<Spot['layer'] | 'glasses', Phaser.GameObjects.GameObject[]> = { back: [], collar: [], wrap: [], glasses: [], hat: [], prop: [] };
  const wear = (index: number, usual: 'head' | 'neck') => {
    const { placement = usual, fit, icon } = ACCESSORIES[index];
    const spot = SPOTS_WORN[placement];
    const side = spot.layer === 'prop' ? wide : 1; // props stand clear of a wider head
    const px = (spot.x * side + (fit?.shift ?? 0)) * r;
    const py = (spot.y + (fit?.lift ?? 0)) * r;
    const size = spot.size * (fit?.scale ?? 1) * r;
    if (fit?.shadow !== false && (spot.layer === 'hat' || spot.grounded)) {
      // A soft contact shadow: under a hat's brim on the fur, or on the floor under something standing by the cat.
      const shadow = scene.add.graphics();
      const sp = pen(shadow, r);
      if (spot.layer === 'hat') sp.glow(px / r, (py + size * 0.56) / r, (size * 1.9) / r, (size * 0.5) / r, 0x1c1229, 0.3, 4);
      else sp.glow(px / r, (py + size * 0.86) / r, (size * 1.9) / r, (size * 0.44) / r, 0x000000, 0.34, 4);
      layers[spot.layer].push(shadow);
    }
    const drawn = scene.add.graphics();
    paintIcon(drawn, size, icon, size > r * 0.8 ? WRAP_LINE : 1);
    const worn = scene.add.container(px, py, [drawn]).setAngle(fit?.tilt ?? spot.angle ?? 0);
    // What is fitted to the head's outline stretches with a wider head.
    if (spot.layer === 'wrap' || spot.layer === 'collar' || spot.layer === 'back') worn.setScale(wide, 1);
    layers[spot.layer].push(worn);
  };
  if (cat.neck >= 0) wear(cat.neck, 'neck');
  if (cat.head >= 0) wear(cat.head, 'head');
  if (cat.face >= 0) {
    // Glasses are drawn to the eyes' own measurements: same scale as the cat, centered between its eyes.
    const worn = scene.add.graphics({ y: EYE_LINE * r });
    paintIcon(worn, r, ACCESSORIES[cat.face].icon);
    layers.glasses.push(worn);
  }
  const parts: Phaser.GameObjects.GameObject[] = [...layers.back, g, blush, eyes, mouth];
  if (COATS[cat.coat].rarity === 3) parts.push(drawIcon(scene, 0.95 * r, -0.85 * r, 0.26 * r, 'sparkle'));
  // Helmets and hair sit under the glasses; hats rest on top; whatever is held or stands by the cat comes last.
  parts.push(...layers.collar, ...layers.wrap, ...layers.glasses, ...layers.hat, ...layers.prop);
  return { container: scene.add.container(x, y, parts), face };
}
