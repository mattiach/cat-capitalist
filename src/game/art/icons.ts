import Phaser from 'phaser';
import type { IconName } from '../../logic/data/iconNames.ts';
import { DRAW_BUSINESS } from './businessIcon.ts';
import { mix, shade } from './color.ts';
import { pen, type Pen, type Point } from './pen.ts';

export type { IconName };

type Draw = (p: Pen, g: Phaser.GameObjects.Graphics) => void;

const WHITE = 0xffffff;
const INK = 0x2b1e2f;
const GOLD = 0xffcf5a;
const GOLD_EDGE = shade(GOLD, 0.55);
const CYAN = 0x5ce1ff;
const CYAN_EDGE = 0x2a8fb0;
const PINK = 0xff78a8;
const RED = 0xff5a5f;
const FUR = 0xf4a261;
const MIRROR = [-1, 1];

/**
 * A helmet shell worn over the head, in head coordinates (the head spans ±1 wide, ±0.9 tall, ears reach -1.6).
 * One outline runs round the outside and back along the face opening, so the shell reads as one piece
 * wrapped round the head instead of a plate stuck in front of it.
 */
function helmetShell(p: Pen, color: number, edge: number, opening: Point[], top = -1.48, flare = 1.2) {
  const outer: Point[] = [[-flare, 0.92], [-1.16, 0.3], [-1.18, -0.5], [-0.98, -1.1], [-0.56, top + 0.08], [0, top], [0.56, top + 0.08], [0.98, -1.1], [1.18, -0.5], [1.16, 0.3], [flare, 0.92]];
  p.poly([...outer, ...[...opening].reverse()], color, edge);
}

/** A headband following the skull with two round ears on it, in head units. */
function mouseEarBand(p: Pen) {
  const black = 0x1a1420;
  const rim = 0x4a4058;
  for (const side of MIRROR) {
    p.circle(side * 0.74, -1.06, 0.45, black, rim);
    p.circle(side * 0.74, -1.04, 0.3, 0x2a2233);
    p.glow(side * 0.74 - 0.14, -1.2, 0.34, 0.24, WHITE, 0.18, 3);
  }
  band(p, brow(-0.02), 0.84, 0.13, black, rim);
}

/** Pixel art from rows of characters: k ink, c diamond, w highlight, b wood; anything else is empty. */
const PIXEL_COLORS: Record<string, number> = { k: 0x1d3a3a, c: 0x4fe6d8, w: 0xd8fffb, b: 0x8a5a2b };
function pixels(p: Pen, rows: string[]) {
  const cell = 2 / rows.length;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (PIXEL_COLORS[ch]) p.box(-1 + (x + 0.5) * cell, -1 + (y + 0.5) * cell, cell, cell, 0, PIXEL_COLORS[ch]);
  }));
}

/** Small cat head, shared by every icon that is about a cat. */
function catHead(p: Pen, x: number, y: number, s: number, fur = FUR, eyes: 'dots' | 'hearts' | 'wide' | 'happy' = 'dots') {
  const edge = shade(fur, 0.58);
  for (const side of MIRROR) {
    p.poly([[x + side * 0.28 * s, y - 0.52 * s], [x + side * 0.82 * s, y - 0.22 * s], [x + side * 0.8 * s, y - 1 * s]], fur, edge);
    p.poly([[x + side * 0.42 * s, y - 0.48 * s], [x + side * 0.72 * s, y - 0.32 * s], [x + side * 0.72 * s, y - 0.76 * s]], 0xffb3c1);
  }
  p.ellipse(x, y, 1.8 * s, 1.56 * s, fur, edge);
  p.glow(x - 0.05 * s, y - 0.38 * s, 1.15 * s, 0.64 * s, WHITE, 0.2);
  p.glow(x, y + 0.48 * s, 1.3 * s, 0.56 * s, edge, 0.24);
  for (const side of MIRROR) {
    const ex = x + side * 0.36 * s;
    const ey = y - 0.08 * s;
    if (eyes === 'hearts') p.heart(ex, ey, 0.2 * s, 0xff3b6b);
    else if (eyes === 'happy') p.arc(ex, ey + 0.08 * s, 0.17 * s, 205, 335, INK, 1.2);
    else if (eyes === 'wide') { p.circle(ex, ey, 0.21 * s, WHITE, INK); p.circle(ex, ey, 0.09 * s, INK); }
    else { p.ellipse(ex, ey, 0.24 * s, 0.32 * s, INK); p.circle(ex + 0.04 * s, ey - 0.07 * s, 0.05 * s, WHITE); }
    p.line(x + side * 0.5 * s, y + 0.26 * s, x + side * 1.02 * s, y + 0.18 * s, shade(fur, 0.58), 0.6);
  }
  p.poly([[x - 0.09 * s, y + 0.14 * s], [x + 0.09 * s, y + 0.14 * s], [x, y + 0.26 * s]], 0xff8fa3);
  p.line(x, y + 0.26 * s, x - 0.13 * s, y + 0.4 * s, INK, 0.7);
  p.line(x, y + 0.26 * s, x + 0.13 * s, y + 0.4 * s, INK, 0.7);
}

const paw = (p: Pen, x: number, y: number, s: number, color: number) => {
  p.ellipse(x, y + 0.2 * s, 1.1 * s, 0.9 * s, color);
  for (const [dx, dy] of [[-0.62, -0.28], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.28]]) p.ellipse(x + dx * s, y + dy * s, 0.42 * s, 0.52 * s, color);
};

const gem = (p: Pen, x: number, y: number, s: number, color = CYAN) => {
  const edge = shade(color, 0.5);
  p.poly([[x - 0.8 * s, y - 0.2 * s], [x - 0.45 * s, y - 0.7 * s], [x + 0.45 * s, y - 0.7 * s], [x + 0.8 * s, y - 0.2 * s], [x, y + 0.85 * s]], color, edge);
  p.poly([[x - 0.45 * s, y - 0.7 * s], [x - 0.8 * s, y - 0.2 * s], [x - 0.28 * s, y - 0.2 * s]], mix(color, WHITE, 0.45));
  p.poly([[x + 0.45 * s, y - 0.7 * s], [x + 0.8 * s, y - 0.2 * s], [x + 0.28 * s, y - 0.2 * s]], shade(color, 0.78));
  p.poly([[x - 0.28 * s, y - 0.2 * s], [x + 0.28 * s, y - 0.2 * s], [x, y + 0.85 * s]], mix(color, WHITE, 0.25));
  p.line(x - 0.8 * s, y - 0.2 * s, x + 0.8 * s, y - 0.2 * s, edge, 0.6);
};

const crown = (p: Pen, color: number, jewel: number) => {
  const edge = shade(color, 0.55);
  p.poly([[-0.8, 0.6], [-0.9, -0.35], [-0.42, 0.08], [0, -0.62], [0.42, 0.08], [0.9, -0.35], [0.8, 0.6]], color, edge);
  p.box(0, 0.5, 1.6, 0.22, 0.05, shade(color, 0.85), edge);
  for (const [x, y] of [[-0.9, -0.38], [0, -0.66], [0.9, -0.38]]) p.circle(x, y, 0.1, jewel, shade(jewel, 0.55));
  for (const x of [-0.45, 0, 0.45]) p.circle(x, 0.5, 0.07, jewel);
};

const goose = (p: Pen, body: number, x = 0, y = 0, s = 1) => {
  const edge = shade(body, 0.6);
  p.ellipse(x - 0.08 * s, y + 0.3 * s, 1.3 * s, 0.86 * s, body, edge);
  p.poly([[x + 0.25 * s, y + 0.2 * s], [x + 0.56 * s, y - 0.5 * s], [x + 0.28 * s, y - 0.5 * s], [x + 0.02 * s, y + 0.1 * s]], body);
  p.circle(x + 0.44 * s, y - 0.56 * s, 0.25 * s, body, edge);
  p.poly([[x + 0.64 * s, y - 0.62 * s], [x + 0.98 * s, y - 0.52 * s], [x + 0.64 * s, y - 0.44 * s]], 0xff9a3c);
  p.circle(x + 0.5 * s, y - 0.62 * s, 0.05 * s, INK);
  p.arc(x - 0.16 * s, y + 0.16 * s, 0.3 * s, 20, 160, edge, 0.8);
};

const hatCone = (p: Pen, color: number, tip: Point = [0, -0.95]) => p.poly([[-0.62, 0.55], [0.62, 0.55], tip], color, shade(color, 0.55));

const roundLenses = (p: Pen, radius: number, frame: number, lens: number, alpha: number) => {
  const rim = shade(frame, 0.5);
  for (const side of MIRROR) {
    p.circle(side * 0.36, 0, radius, lens, undefined, alpha);
    p.arc(side * 0.36, 0, radius, 0, 360, rim, 1.45, 0.8);
    p.arc(side * 0.36, 0, radius, 0, 360, frame, 0.9, 1.4);
    p.line(side * (0.36 + radius), -0.04, side * 0.97, -0.14, frame, 1);
    p.line(side * (0.36 - radius * 0.5), -radius * 0.5, side * (0.36 - radius * 0.15), -radius * 0.62, WHITE, 0.7, 0.7);
  }
  p.arc(0, 0.1, 0.12, 200, 340, rim, 1.3, 0.8);
  p.arc(0, 0.1, 0.12, 200, 340, frame, 0.85, 1.4);
};

const boxShades = (p: Pen, w: number, h: number, frame: number, lens: number) => {
  for (const side of MIRROR) {
    p.box(side * 0.37, 0, w, h, 0.09, lens, frame);
    p.line(side * (0.37 + w / 2), -0.04, side * 0.97, -0.12, frame, 1);
    p.line(side * 0.25, -0.07, side * 0.38, -0.07, WHITE, 0.8, 0.6);
  }
  p.line(-0.14, -0.03, 0.14, -0.03, frame, 1.2);
};

const lashes = (p: Pen, color: number, tip?: number) => {
  for (const side of MIRROR) {
    p.arc(side * 0.36, 0.02, 0.19, 205, 335, color, 1.1);
    for (let a = 205; a <= 335; a += 26) {
      const t = Phaser.Math.DegToRad(a);
      const outward = side * Math.cos(t) > 0 ? 0.36 : 0.3;
      const ex = side * 0.36 + Math.cos(t) * outward;
      const ey = 0.02 + Math.sin(t) * outward;
      p.line(side * 0.36 + Math.cos(t) * 0.18, 0.02 + Math.sin(t) * 0.18, ex, ey, color, 0.9);
      if (tip !== undefined) p.circle(ex, ey, 0.035, tip);
    }
  }
};

/** A band of even thickness following the curve y = at(x), from -half to +half. */
function band(p: Pen, at: (x: number) => number, half: number, thickness: number, color: number, edge?: number) {
  const xs = Array.from({ length: 11 }, (_, k) => -half + (k / 10) * 2 * half);
  p.poly([...xs.map((x): Point => [x, at(x) - thickness / 2]), ...xs.reverse().map((x): Point => [x, at(x) + thickness / 2])], color, edge);
}

/**
 * The line a collar follows, in neck-item units: it hugs the curve of the chin instead of cutting straight
 * across it, which is what makes a collar look worn. `drop` lowers it.
 */
const chin = (drop = 0) => (x: number) => -2.42 + Math.sqrt(2.2 ** 2 - x * x) + drop;
const CHIN = chin();
/** The line of the forehead, in head units (see SPOTS_WORN in drawCat): the skull's outline, lowered by `drop`. */
const brow = (drop = 0) => (x: number) => -0.9 * Math.sqrt(Math.max(0, 1 - x * x)) + drop;

const scarfBand = (p: Pen, color: number, stripe: number) => {
  const edge = shade(color, 0.6);
  // the hanging end first, so the wrap overlaps it
  p.poly([[0.3, -0.2], [0.78, -0.26], [0.82, 0.78], [0.34, 0.84]], color, edge);
  for (const y of [0.46, 0.64]) p.line(0.38, y + 0.02, 0.78, y - 0.02, stripe, 1.1);
  band(p, CHIN, 1.32, 0.5, color, edge);
  for (const x of [-0.92, -0.46, 0, 0.46, 0.92]) p.line(x, CHIN(x) - 0.2, x, CHIN(x) + 0.2, stripe, 1);
  p.box(0.56, -0.2, 0.42, 0.4, 0.12, shade(color, 0.86), edge);
};

const collarBand = (p: Pen, color: number, thickness = 0.34) => band(p, CHIN, 1.3, thickness, color, shade(color, 0.55));

const ICONS: Record<IconName, Draw> = {
  // ---- currencies and interface ----
  fish: (p) => {
    const fish = 0xffb347;
    const edge = shade(fish, 0.55);
    p.poly([[0.42, 0], [0.96, -0.5], [0.96, 0.5]], fish, edge);
    p.ellipse(-0.14, 0, 1.56, 0.96, fish, edge);
    p.arc(-0.2, 0, 0.42, -50, 50, edge, 0.8);
    p.poly([[-0.18, -0.46], [0.22, -0.46], [0.02, -0.76]], shade(fish, 0.85), edge);
    p.circle(-0.54, -0.1, 0.11, WHITE, INK);
    p.circle(-0.54, -0.1, 0.045, INK);
  },
  diamond: (p) => gem(p, 0, -0.04, 1),
  // Small Angel Cat, for tabs and chips; the big one in Cat Heaven is drawAngelCat.
  halo: (p) => {
    for (const side of MIRROR) {
      for (const [angle, length] of [[-44, 0.72], [-12, 0.8], [20, 0.66]]) p.leaf(side * 0.42, 0.36, side > 0 ? angle : 180 - angle, length, 0.2, 0xf4f8ff);
    }
    catHead(p, 0, 0.34, 0.6, 0xf8f4ec, 'happy');
    for (const side of MIRROR) p.glow(side * 0.34, 0.46, 0.3, 0.16, 0xff7aa2, 0.55, 3);
    p.glow(0, -0.64, 1.1, 0.5, 0xffe28a, 0.45, 4);
    p.ring(0, -0.64, 0.82, 0.26, GOLD, 1.5);
  },
  chart: (p) => {
    p.box(0, 0, 1.8, 1.8, 0.16, 0x2f3b55, 0x5a6b8c);
    [[-0.5, 0.28, 0.5], [0, 0.08, 0.9], [0.5, -0.12, 1.3]].forEach(([x, y, h]) => p.box(x, y + 0.2, 0.3, h, 0.03, 0x5bd7a0));
    p.line(-0.7, 0, 0.7, -0.62, RED, 1.2);
    p.poly([[0.76, -0.68], [0.42, -0.66], [0.62, -0.38]], RED);
  },
  bolt: (p) => p.poly([[0.16, -0.98], [-0.6, 0.14], [-0.08, 0.14], [-0.2, 0.98], [0.62, -0.26], [0.1, -0.26]], GOLD, 0xd98a1f),
  lock: (p) => {
    p.arc(0, -0.2, 0.42, 180, 360, 0xb9c2d0, 2.4);
    p.box(0, 0.32, 1.24, 1, 0.14, 0xe0a63a, 0x8a5f17);
    p.circle(0, 0.24, 0.14, INK);
    p.box(0, 0.44, 0.1, 0.26, 0.03, INK);
  },
  check: (p) => {
    p.line(-0.72, 0.04, -0.2, 0.6, 0x32c982, 3.4);
    p.line(-0.2, 0.6, 0.76, -0.56, 0x32c982, 3.4);
  },
  close: (p) => {
    p.line(-0.6, -0.6, 0.6, 0.6, WHITE, 3);
    p.line(0.6, -0.6, -0.6, 0.6, WHITE, 3);
  },
  shuffle: (p) => {
    p.line(-0.8, 0.5, 0.45, -0.5, WHITE, 2.6);
    p.line(-0.8, -0.5, 0.45, 0.5, WHITE, 2.6);
    p.poly([[0.4, -0.85], [0.9, -0.5], [0.4, -0.15]], WHITE);
    p.poly([[0.4, 0.15], [0.9, 0.5], [0.4, 0.85]], WHITE);
  },
  fullscreen: (p) => {
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      p.line(x * 0.7, y * 0.7, x * 0.2, y * 0.7, WHITE, 3);
      p.line(x * 0.7, y * 0.7, x * 0.7, y * 0.2, WHITE, 3);
    }
  },
  arrowLeft: (p) => p.poly([[0.6, -0.8], [0.6, 0.8], [-0.7, 0]], WHITE),
  arrowRight: (p) => p.poly([[-0.6, -0.8], [-0.6, 0.8], [0.7, 0]], WHITE),
  arrowUp: (p) => {
    p.box(0, 0, 1.76, 1.76, 0.3, 0x3f8fd8, 0x28609a);
    p.poly([[0, -0.66], [0.62, 0.02], [0.24, 0.02], [0.24, 0.62], [-0.24, 0.62], [-0.24, 0.02], [-0.62, 0.02]], WHITE);
  },
  star: (p) => p.star(0, 0.04, 0.98, 0.44, GOLD, GOLD_EDGE),
  sparkle: (p) => {
    p.star(-0.14, 0.1, 0.82, 0.18, GOLD, GOLD_EDGE, 4);
    p.star(0.62, -0.58, 0.36, 0.09, 0xfff1b8, undefined, 4);
    p.star(0.56, 0.62, 0.24, 0.06, 0xfff1b8, undefined, 4);
  },
  flame: (p) => {
    p.poly([[0, -1], [0.34, -0.48], [0.76, -0.1], [0.68, 0.56], [0.22, 0.96], [-0.3, 0.96], [-0.72, 0.56], [-0.72, 0.02], [-0.42, -0.26], [-0.2, -0.12]], 0xff7a2f, 0xc84c12);
    p.poly([[0.04, -0.26], [0.42, 0.24], [0.28, 0.72], [-0.18, 0.78], [-0.4, 0.36], [-0.14, 0.02]], 0xffc53d);
    p.ellipse(0, 0.54, 0.36, 0.44, 0xfff1b8);
  },
  rainbow: (p) => {
    [0xff5a5f, 0xff9a3c, 0xffd93c, 0x5bd77a, 0x4da3ff, 0xa77bff].forEach((color, k) => p.arc(0, 0.5, 0.92 - k * 0.14, 180, 360, color, 2));
    for (const x of [-0.66, 0.66]) p.ellipse(x, 0.56, 0.6, 0.34, WHITE, 0xc8d1dc);
  },
  heart: (p) => p.heart(0, 0, 0.92, 0xff5a8a, 0xb82f5e),
  sleep: (p) => {
    const z = (x: number, y: number, s: number) => {
      p.line(x - s, y - s, x + s, y - s, 0xcfe4ff, 1.4);
      p.line(x + s, y - s, x - s, y + s, 0xcfe4ff, 1.4);
      p.line(x - s, y + s, x + s, y + s, 0xcfe4ff, 1.4);
    };
    z(-0.42, 0.42, 0.34);
    z(0.2, -0.1, 0.24);
    z(0.62, -0.6, 0.16);
  },
  exclaim: (p) => {
    p.poly([[-0.26, -0.96], [0.26, -0.96], [0.14, 0.36], [-0.14, 0.36]], RED, shade(RED, 0.55));
    p.circle(0, 0.74, 0.2, RED, shade(RED, 0.55));
  },
  play: (p) => p.poly([[-0.6, -0.84], [0.8, 0], [-0.6, 0.84]], WHITE),
  pause: (p) => { for (const x of [-0.38, 0.38]) p.box(x, 0, 0.42, 1.6, 0.08, WHITE); },
  previous: (p) => {
    p.box(-0.74, 0, 0.26, 1.5, 0.05, WHITE);
    p.poly([[0.8, -0.76], [0.8, 0.76], [-0.5, 0]], WHITE);
  },
  next: (p) => {
    p.box(0.74, 0, 0.26, 1.5, 0.05, WHITE);
    p.poly([[-0.8, -0.76], [-0.8, 0.76], [0.5, 0]], WHITE);
  },
  note: (p) => {
    const note = 0xb06bff;
    p.ellipse(-0.46, 0.66, 0.66, 0.5, note, shade(note, 0.55));
    p.ellipse(0.54, 0.42, 0.66, 0.5, note, shade(note, 0.55));
    p.poly([[-0.2, 0.62], [-0.2, -0.56], [0.8, -0.86], [0.8, 0.4], [0.66, 0.4], [0.66, -0.52], [-0.06, -0.3], [-0.06, 0.62]], note, shade(note, 0.55));
  },
  bell: (p) => {
    p.poly([[0, -0.84], [0.46, -0.5], [0.56, 0.2], [0.86, 0.56], [-0.86, 0.56], [-0.56, 0.2], [-0.46, -0.5]], GOLD, GOLD_EDGE);
    p.circle(0, 0.72, 0.18, 0xd98a1f, GOLD_EDGE);
    p.circle(0, -0.86, 0.1, GOLD, GOLD_EDGE);
  },
  paw: (p) => paw(p, 0, 0.14, 0.86, PINK),
  catFace: (p) => catHead(p, 0, 0.14, 0.92),
  catLove: (p) => catHead(p, 0, 0.14, 0.92, FUR, 'hearts'),
  catWow: (p) => catHead(p, 0, 0.14, 0.92, 0xc3a6d8, 'wide'),
  catHalo: (p) => {
    catHead(p, 0, 0.26, 0.78, 0xf5f3ef, 'happy');
    p.glow(0, -0.74, 1.2, 0.5, 0xffe28a, 0.45, 4);
    p.ring(0, -0.74, 0.92, 0.28, GOLD, 1.5);
  },
  headphones: (p) => {
    p.arc(0, 0.08, 0.76, 180, 360, 0x4a5060, 2.2);
    for (const side of MIRROR) {
      p.box(side * 0.76, 0.24, 0.42, 0.82, 0.14, PINK, shade(PINK, 0.55));
      p.box(side * 0.94, 0.24, 0.12, 0.44, 0.04, 0x4a5060);
    }
  },
  celebrate: (p) => {
    p.poly([[-0.9, 0.9], [-0.42, -0.36], [0.34, 0.42]], GOLD, GOLD_EDGE);
    [[0.3, -0.76, PINK], [0.76, -0.3, CYAN], [0.72, 0.46, 0x5bd77a], [-0.1, -0.56, 0xff9a3c]].forEach(([x, y, color]) => p.circle(x, y, 0.13, color));
    p.arc(0.2, -0.16, 0.42, 200, 320, RED, 1.4);
  },

  // ---- tabs and awards ----
  shop: (p) => {
    p.box(0, 0.28, 1.5, 1.2, 0.05, 0xf3dfb6, 0x9a7a5c);
    p.box(-0.32, 0.46, 0.4, 0.84, 0.03, 0x7b4b2a, 0x4f2f18);
    p.box(0.36, 0.26, 0.5, 0.44, 0.03, 0x8fd3ff, 0x355b8c);
    p.poly([[-0.96, -0.36], [-0.72, -0.92], [0.72, -0.92], [0.96, -0.36]], RED, shade(RED, 0.55));
    for (const x of [-0.36, 0.36]) p.poly([[x - 0.12, -0.92], [x + 0.12, -0.92], [x + 0.18, -0.36], [x - 0.18, -0.36]], WHITE);
  },
  sofa: (p) => {
    const cloth = 0x5b8def;
    const edge = shade(cloth, 0.55);
    p.box(0, -0.14, 1.5, 0.96, 0.2, cloth, edge);
    for (const side of MIRROR) p.box(side * 0.78, 0.26, 0.42, 0.9, 0.16, shade(cloth, 0.88), edge);
    p.box(0, 0.32, 1.2, 0.46, 0.1, mix(cloth, WHITE, 0.25), edge);
    for (const side of MIRROR) p.box(side * 0.62, 0.84, 0.16, 0.2, 0.02, 0x7b4b2a);
  },
  gamepad: (p) => {
    p.box(0, 0.06, 1.84, 1.04, 0.42, 0x7a5ae0, shade(0x7a5ae0, 0.55));
    p.box(-0.46, 0.06, 0.44, 0.14, 0.02, WHITE);
    p.box(-0.46, 0.06, 0.14, 0.44, 0.02, WHITE);
    p.circle(0.34, 0.2, 0.12, PINK);
    p.circle(0.58, -0.04, 0.12, GOLD);
  },
  floppy: (p) => {
    p.poly([[-0.84, -0.84], [0.6, -0.84], [0.84, -0.6], [0.84, 0.84], [-0.84, 0.84]], 0x4d7bd8, 0x274a8f);
    p.box(0, 0.4, 1.16, 0.74, 0.03, 0xf2f4fa);
    p.box(-0.02, -0.56, 0.86, 0.5, 0.03, 0xc8d1dc);
    p.box(0.22, -0.56, 0.2, 0.34, 0.02, 0x4a5060);
  },
  trophy: (p) => {
    for (const side of MIRROR) p.arc(side * 0.54, -0.42, 0.3, side > 0 ? -90 : 90, side > 0 ? 90 : 270, GOLD_EDGE, 1.6);
    p.poly([[-0.56, -0.86], [0.56, -0.86], [0.42, -0.12], [0.14, 0.14], [-0.14, 0.14], [-0.42, -0.12]], GOLD, GOLD_EDGE);
    p.box(0, 0.42, 0.26, 0.56, 0.02, 0xe0a63a);
    p.box(0, 0.78, 0.92, 0.26, 0.05, 0x7b4b2a, 0x4f2f18);
    p.line(-0.28, -0.7, -0.2, -0.26, 0xfff1b8, 1, 0.8);
  },
  coin: (p) => {
    p.circle(0, 0, 0.86, GOLD, GOLD_EDGE);
    p.arc(0, 0, 0.62, 0, 360, GOLD_EDGE, 0.7);
    paw(p, 0, 0.06, 0.36, GOLD_EDGE);
  },
  coins: (p) => {
    for (const [x, y] of [[-0.42, 0.58], [-0.42, 0.28], [-0.42, -0.02], [0.42, 0.58], [0.42, 0.28], [0, -0.32], [0, -0.62]]) {
      p.ellipse(x, y, 0.96, 0.46, GOLD, GOLD_EDGE);
    }
  },
  banknote: (p) => {
    const bill = 0x5bbf7a;
    p.box(0, 0, 1.92, 1.16, 0.08, bill, shade(bill, 0.55));
    p.circle(0, 0, 0.34, mix(bill, WHITE, 0.45), shade(bill, 0.55));
    paw(p, 0, 0.02, 0.17, shade(bill, 0.5));
    for (const side of MIRROR) p.circle(side * 0.68, 0, 0.09, mix(bill, WHITE, 0.45));
  },
  bank: (p) => {
    const stone = 0xdfe3ec;
    const edge = 0x6d7588;
    p.poly([[0, -0.96], [0.96, -0.38], [-0.96, -0.38]], stone, edge);
    for (const x of [-0.6, -0.2, 0.2, 0.6]) p.box(x, 0.2, 0.22, 0.98, 0.02, stone, edge);
    p.box(0, 0.8, 1.84, 0.24, 0.03, stone, edge);
    p.circle(0, -0.56, 0.1, GOLD);
  },
  galaxy: (p) => {
    p.circle(0, 0, 0.94, 0x1f1a4d, 0x4c3f9e);
    p.ellipse(0, 0, 1.5, 0.48, 0xb06bff, undefined, 0.45);
    p.ellipse(0, 0, 0.8, 0.26, 0xffb3e0, undefined, 0.7);
    p.circle(0, 0, 0.13, WHITE);
    for (const [x, y] of [[-0.52, -0.46], [0.46, -0.56], [0.58, 0.44], [-0.32, 0.56]]) p.circle(x, y, 0.04, WHITE);
  },
  planet: (p) => {
    p.ellipse(0, 0, 1.96, 0.54, 0xd9b48f, shade(0xd9b48f, 0.6));
    p.circle(0, 0, 0.62, 0xf0a35e, shade(0xf0a35e, 0.55));
    p.ellipse(0, -0.24, 1, 0.16, shade(0xf0a35e, 0.8));
    p.ellipse(0, 0.2, 1.1, 0.14, shade(0xf0a35e, 0.8));
    p.arc(0, 0, 0.96, 18, 162, 0xd9b48f, 1.6);
  },
  comet: (p) => {
    p.poly([[0.32, 0.32], [-0.94, -0.56], [-0.46, -0.18], [-0.96, -0.1], [-0.3, 0.14], [-0.58, 0.42]], 0x8fd3ff, undefined, 0.7);
    p.star(0.4, 0.38, 0.54, 0.24, GOLD, GOLD_EDGE);
  },
  tie: (p) => {
    p.poly([[-0.8, -0.86], [0, -0.42], [0.8, -0.86], [0.56, -0.2], [0, -0.32], [-0.56, -0.2]], WHITE, 0xb9c2d0);
    p.poly([[-0.2, -0.42], [0.2, -0.42], [0.1, -0.12], [0.34, 0.6], [0, 0.96], [-0.34, 0.6], [-0.1, -0.12]], 0x3f6fd8, 0x274a8f);
    p.line(-0.2, 0.3, 0.2, 0.06, 0x8fb3ff, 1);
  },
  clipboard: (p) => {
    p.box(0, 0.08, 1.4, 1.76, 0.1, 0xb07c4f, 0x6f4a2a);
    p.box(0, 0.14, 1.1, 1.42, 0.03, 0xf7f4ea);
    p.box(0, -0.74, 0.6, 0.3, 0.06, 0xc8d1dc, 0x76818f);
    for (const y of [-0.26, 0.14, 0.54]) {
      p.line(-0.36, y, -0.24, y + 0.1, 0x32c982, 1.2);
      p.line(-0.24, y + 0.1, -0.1, y - 0.1, 0x32c982, 1.2);
      p.line(0.04, y, 0.4, y, 0x8a8196, 1.1);
    }
  },
  shoppingBag: (p) => {
    p.arc(0, -0.34, 0.3, 180, 360, 0x7b4b2a, 1.6);
    p.poly([[-0.7, -0.34], [0.7, -0.34], [0.84, 0.92], [-0.84, 0.92]], PINK, shade(PINK, 0.55));
    p.heart(0, 0.3, 0.32, WHITE);
  },
  magnifier: (p) => {
    p.line(0.28, 0.28, 0.86, 0.86, 0x7b4b2a, 3);
    p.circle(-0.2, -0.2, 0.62, 0xbfe6ff, 0x4a5060, 0.8);
    p.arc(-0.2, -0.2, 0.62, 0, 360, 0x4a5060, 1.5);
    p.arc(-0.2, -0.2, 0.4, 190, 260, WHITE, 1.1);
  },
  dress: (p) => {
    p.poly([[-0.3, -0.92], [-0.14, -0.62], [0.14, -0.62], [0.3, -0.92], [0.42, -0.16], [0.86, 0.92], [-0.86, 0.92], [-0.42, -0.16]], PINK, shade(PINK, 0.55));
    p.box(0, -0.1, 0.84, 0.14, 0.03, 0xffd6e4);
    for (const x of [-0.42, 0, 0.42]) p.circle(x, 0.6, 0.06, WHITE);
  },
  pouch: (p) => {
    p.ellipse(0, 0.26, 1.5, 1.34, 0xb07c4f, 0x6f4a2a);
    p.poly([[-0.34, -0.42], [0.34, -0.42], [0.54, -0.86], [-0.54, -0.86]], 0xc99466, 0x6f4a2a);
    p.line(-0.38, -0.42, 0.38, -0.42, GOLD, 1.6);
    gem(p, 0, 0.3, 0.34);
  },
  racecar: (p) => {
    p.poly([[-0.96, 0.32], [-0.72, -0.1], [-0.2, -0.16], [0.08, -0.56], [0.46, -0.56], [0.62, -0.14], [0.98, 0.04], [0.98, 0.34]], RED, shade(RED, 0.55));
    p.poly([[0.16, -0.46], [0.42, -0.46], [0.5, -0.16], [0, -0.16]], 0x8fd3ff, 0x355b8c);
    for (const x of [-0.56, 0.56]) { p.circle(x, 0.42, 0.28, INK, 0x000000); p.circle(x, 0.42, 0.12, 0xc8d1dc); }
    p.line(-0.64, 0.04, 0.02, 0.04, WHITE, 1.2);
  },
  flask: (p) => {
    p.poly([[-0.2, -0.86], [0.2, -0.86], [0.2, -0.26], [0.78, 0.76], [0.66, 0.94], [-0.66, 0.94], [-0.78, 0.76], [-0.2, -0.26]], 0xdff4ff, 0x4f7f9f);
    p.poly([[-0.42, 0.26], [0.42, 0.26], [0.72, 0.78], [0.62, 0.88], [-0.62, 0.88], [-0.72, 0.78]], 0x5bd77a);
    p.box(0, -0.9, 0.6, 0.16, 0.03, 0x4f7f9f);
    for (const [x, y, s] of [[-0.14, 0.54, 0.09], [0.2, 0.42, 0.06], [0.1, 0.68, 0.05]]) p.circle(x, y, s, 0xbff2c9);
  },
  house: (p) => {
    p.box(0, 0.36, 1.44, 1.12, 0.04, 0xf3dfb6, 0x9a7a5c);
    p.poly([[0, -0.92], [1, -0.12], [-1, -0.12]], RED, shade(RED, 0.55));
    p.box(-0.28, 0.54, 0.36, 0.76, 0.03, 0x7b4b2a, 0x4f2f18);
    p.box(0.36, 0.24, 0.36, 0.36, 0.03, 0x8fd3ff, 0x355b8c);
    p.heart(0, -0.3, 0.14, WHITE);
  },
  dove: (p) => {
    p.ellipse(-0.06, 0.2, 1.3, 0.72, WHITE, 0xb9c2d0);
    p.circle(0.58, -0.14, 0.28, WHITE, 0xb9c2d0);
    p.poly([[0.82, -0.2], [1.02, -0.1], [0.82, -0.02]], 0xff9a3c);
    p.circle(0.64, -0.2, 0.04, INK);
    p.poly([[-0.1, 0], [-0.62, -0.92], [0.34, -0.3]], 0xeef2f8, 0xb9c2d0);
    p.poly([[-0.68, 0.22], [-1, 0.56], [-0.46, 0.52]], WHITE, 0xb9c2d0);
  },
  shield: (p) => {
    p.poly([[0, -0.96], [0.84, -0.62], [0.74, 0.22], [0, 0.98], [-0.74, 0.22], [-0.84, -0.62]], 0x4d7bd8, 0x274a8f);
    p.poly([[0, -0.96], [0, 0.98], [-0.74, 0.22], [-0.84, -0.62]], 0x6f9bf0);
    p.arc(0, -0.22, 0.32, 0, 360, GOLD, 1.3);
  },
  temple: (p) => {
    const stone = 0xf0e6d2;
    const edge = 0x8a7a5c;
    p.poly([[0, -0.94], [0.96, -0.4], [-0.96, -0.4]], stone, edge);
    p.box(0, -0.32, 1.76, 0.14, 0.02, stone, edge);
    for (const x of [-0.66, -0.22, 0.22, 0.66]) p.box(x, 0.26, 0.24, 1.02, 0.02, stone, edge);
    p.box(0, 0.84, 1.92, 0.2, 0.02, stone, edge);
  },
  briefcase: (p) => {
    p.box(0, -0.54, 0.7, 0.42, 0.08, 0x000000, 0x4f2f18, 0);
    p.box(0, 0.2, 1.84, 1.3, 0.14, 0x8a5a33, 0x4f2f18);
    p.line(-0.92, 0.12, 0.92, 0.12, 0x4f2f18, 1);
    p.box(0, 0.12, 0.3, 0.26, 0.04, GOLD, GOLD_EDGE);
  },
  cloudBolt: (p) => {
    p.poly([[0.12, 0.02], [-0.32, 0.56], [-0.04, 0.56], [-0.18, 1], [0.4, 0.34], [0.1, 0.34], [0.34, 0.02]], GOLD, 0xd98a1f);
    for (const [x, y, s] of [[-0.46, -0.16, 0.42], [0.04, -0.42, 0.52], [0.52, -0.14, 0.42]]) p.circle(x, y, s, 0xcfd6e6);
    p.box(0, 0, 1.56, 0.44, 0.2, 0xcfd6e6);
  },
  medal: (p) => {
    p.poly([[-0.56, -0.96], [-0.14, -0.96], [0.1, -0.14], [-0.3, -0.14]], 0x4d7bd8);
    p.poly([[0.56, -0.96], [0.14, -0.96], [-0.1, -0.14], [0.3, -0.14]], RED);
    p.circle(0, 0.32, 0.62, GOLD, GOLD_EDGE);
    p.star(0, 0.32, 0.36, 0.16, GOLD_EDGE);
  },
  infinity: (p) => {
    p.arc(-0.42, 0, 0.42, 0, 360, CYAN, 2.4);
    p.arc(0.42, 0, 0.42, 0, 360, PINK, 2.4);
  },
  yarn: (p, g) => DRAW_BUSINESS[0](p, g),
  box: (p, g) => DRAW_BUSINESS[2](p, g),
  rocket: (p, g) => DRAW_BUSINESS[9](p, g),
  allBusinesses: (p) => {
    p.star(0, 0.04, 0.98, 0.46, GOLD, GOLD_EDGE);
    paw(p, 0, 0.1, 0.3, GOLD_EDGE);
  },

  // ---- hats ----
  pinkBow: (p) => {
    const bow = 0xff78a8;
    const edge = shade(bow, 0.55);
    for (const side of MIRROR) {
      p.poly([[side * 0.1, -0.1], [side * 0.92, -0.62], [side * 0.92, 0.5], [side * 0.1, 0.1]], bow, edge);
      p.poly([[side * 0.2, 0], [side * 0.68, -0.28], [side * 0.68, 0.2]], shade(bow, 0.78));
    }
    p.box(0, 0, 0.32, 0.4, 0.1, mix(bow, WHITE, 0.3), edge);
  },
  baseballCap: (p) => {
    const cap = 0x3f6fd8;
    const edge = shade(cap, 0.55);
    p.ellipse(0.42, 0.42, 1.34, 0.3, shade(cap, 0.78), edge);
    p.poly([[-0.76, 0.42], [-0.76, -0.1], [-0.42, -0.58], [0.2, -0.66], [0.62, -0.28], [0.72, 0.42]], cap, edge);
    p.circle(0, -0.66, 0.08, WHITE);
    p.star(-0.06, -0.02, 0.26, 0.12, WHITE);
  },
  flowerCrown: (p) => {
    // worn across the forehead from ear to ear, in head units
    const line = brow(0.16);
    band(p, line, 0.9, 0.09, 0x5bbf5f, 0x3e8f42);
    for (const [x, angle] of [[-0.58, 200], [-0.2, 250], [0.2, 290], [0.58, 340]]) p.leaf(x, line(x), angle, 0.24, 0.08, 0x6fd072);
    [[-0.78, 0.17, 0xff9db8], [-0.4, 0.19, 0xffe28a], [0, 0.23, 0xc9a6ff], [0.4, 0.19, 0xffe28a], [0.78, 0.17, 0xff9db8]].forEach(([x, s, color]) => {
      const y = line(x) - 0.03;
      for (let k = 0; k < 5; k++) {
        const a = Phaser.Math.DegToRad(k * 72 - 90);
        p.circle(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62, s * 0.52, color, shade(color, 0.72));
      }
      p.circle(x, y, s * 0.36, 0xffcf5a, GOLD_EDGE);
    });
  },
  topHat: (p) => {
    const hat = 0x2a2536;
    const edge = 0x4d4560;
    p.box(0, -0.2, 1.1, 1.24, 0.06, hat, edge);
    p.box(0, 0.26, 1.1, 0.26, 0, 0xff5a7a);
    p.ellipse(0, 0.5, 1.84, 0.36, hat, edge);
  },
  royalCrown: (p) => crown(p, GOLD, RED),
  tinyTopHat: (p) => {
    const hat = 0x4a2f6b;
    const edge = shade(hat, 0.6);
    p.box(0.02, 0.02, 0.76, 0.86, 0.05, hat, edge);
    p.box(0.02, 0.3, 0.76, 0.2, 0, GOLD);
    p.ellipse(0, 0.5, 1.3, 0.28, hat, edge);
  },
  crystalCrown: (p) => crown(p, 0xa8ecff, 0xff78e0),
  diamondTiara: (p) => {
    // a tiara resting on the forehead, in head units: silver band, a tall center stone and smaller ones stepping down
    const line = brow(0.12);
    const silver = 0xdfe7f5;
    const edge = 0x8b97ad;
    p.poly([[-0.6, line(-0.6)], [-0.42, line(-0.42) - 0.2], [-0.22, line(-0.22) - 0.08], [0, line(0) - 0.42], [0.22, line(0.22) - 0.08], [0.42, line(0.42) - 0.2], [0.6, line(0.6)]], silver, edge);
    band(p, line, 0.68, 0.1, silver, edge);
    for (const side of MIRROR) {
      gem(p, side * 0.42, line(0.42) - 0.16, 0.11);
      p.circle(side * 0.62, line(0.62), 0.045, CYAN, CYAN_EDGE);
      p.circle(side * 0.22, line(0.22), 0.045, CYAN, CYAN_EDGE);
    }
    gem(p, 0, line(0) - 0.3, 0.22);
    p.star(0.2, line(0) - 0.5, 0.09, 0.025, WHITE, undefined, 4);
  },
  paperHat: (p) => {
    p.poly([[-0.92, 0.5], [0, -0.66], [0.92, 0.5]], 0xf4f1e6, 0x9a927c);
    p.poly([[-0.92, 0.5], [0.92, 0.5], [0.72, 0.76], [-0.72, 0.76]], 0xdcd6c2, 0x9a927c);
    p.line(0, -0.66, 0, 0.5, 0xbcb49c, 0.8);
    for (const [x, y] of [[-0.42, 0.16], [0.36, 0.2]]) p.line(x - 0.12, y, x + 0.12, y, 0xb9b09a, 0.9);
  },
  beanie: (p) => {
    const wool = 0x4db6a8;
    const edge = shade(wool, 0.55);
    p.circle(0, -0.74, 0.22, WHITE, 0xb9c2d0);
    p.poly([[-0.78, 0.26], [-0.66, -0.3], [-0.26, -0.62], [0.26, -0.62], [0.66, -0.3], [0.78, 0.26]], wool, edge);
    p.box(0, 0.42, 1.74, 0.42, 0.14, shade(wool, 0.82), edge);
    for (const x of [-0.56, -0.28, 0, 0.28, 0.56]) p.line(x, 0.24, x, 0.6, edge, 0.8);
  },
  partyHat: (p) => {
    hatCone(p, 0xb06bff);
    p.poly([[-0.34, 0], [0.34, 0], [0.48, 0.28], [-0.48, 0.28]], GOLD);
    p.poly([[-0.14, -0.5], [0.14, -0.5], [0.24, -0.26], [-0.24, -0.26]], 0x5ce1ff);
    p.circle(0, -0.96, 0.18, PINK, shade(PINK, 0.55));
    p.box(0, 0.58, 1.34, 0.14, 0.05, shade(0xb06bff, 0.7));
  },
  strawHat: (p) => {
    const straw = 0xf0d48a;
    const edge = shade(straw, 0.55);
    p.ellipse(0, 0.42, 1.96, 0.5, straw, edge);
    p.poly([[-0.56, 0.36], [-0.48, -0.32], [0, -0.52], [0.48, -0.32], [0.56, 0.36]], straw, edge);
    p.box(0, 0.22, 1.1, 0.24, 0, RED);
    for (const x of [-0.26, 0.2]) p.line(x, -0.3, x + 0.04, 0.06, edge, 0.6);
  },
  chefHat: (p) => {
    const edge = 0xb9c2d0;
    for (const [x, y, s] of [[-0.46, -0.28, 0.44], [0, -0.52, 0.5], [0.46, -0.28, 0.44]]) p.circle(x, y, s, WHITE, edge);
    p.box(0, 0.24, 1.2, 0.74, 0.04, WHITE);
    p.box(0, 0.62, 1.24, 0.22, 0.04, 0xf2f4fa, edge);
    for (const x of [-0.3, 0, 0.3]) p.line(x, -0.1, x, 0.42, 0xdfe3ec, 0.8);
  },
  cowboyHat: (p) => {
    const hide = 0x9a6233;
    const edge = shade(hide, 0.55);
    p.ellipse(0, 0.42, 1.98, 0.44, hide, edge);
    for (const side of MIRROR) p.poly([[side * 0.62, 0.42], [side * 1, 0.1], [side * 1, 0.4]], hide, edge);
    p.poly([[-0.56, 0.36], [-0.5, -0.46], [-0.16, -0.56], [0, -0.42], [0.16, -0.56], [0.5, -0.46], [0.56, 0.36]], hide, edge);
    p.box(0, 0.2, 1.1, 0.2, 0, 0x4a2c15);
    p.star(0, 0.2, 0.16, 0.07, GOLD);
  },
  witchHat: (p) => {
    const hat = 0x3b2a55;
    const edge = 0x7a5aa0;
    p.ellipse(0, 0.56, 1.96, 0.42, hat, edge);
    p.poly([[-0.6, 0.5], [-0.26, -0.3], [0.2, -0.76], [0.74, -0.76], [0.3, -0.42], [0.6, 0.5]], hat, edge);
    p.box(0, 0.32, 1.16, 0.22, 0, 0x7ad872);
    p.box(0, 0.32, 0.3, 0.3, 0.03, GOLD, GOLD_EDGE);
    p.box(0, 0.32, 0.14, 0.14, 0.01, hat);
  },
  vikingHelmet: (p) => {
    const steel = 0xb9c2d0;
    const edge = 0x6b7584;
    for (const side of MIRROR) p.poly([[side * 0.56, 0.1], [side * 1, -0.86], [side * 0.98, -0.1], [side * 0.72, 0.36]], 0xf3e6c8, 0x9a7a5c);
    p.poly([[-0.76, 0.42], [-0.66, -0.2], [-0.3, -0.6], [0.3, -0.6], [0.66, -0.2], [0.76, 0.42]], steel, edge);
    p.box(0, 0.42, 1.66, 0.24, 0.04, 0x8a6a3a, shade(0x8a6a3a, 0.6));
    p.box(0, -0.1, 0.16, 1, 0.02, shade(steel, 0.85));
    for (const x of [-0.56, 0, 0.56]) p.circle(x, 0.42, 0.06, GOLD);
  },
  wizardHat: (p) => {
    const hat = 0x3f4fb0;
    const edge = shade(hat, 0.55);
    p.ellipse(0, 0.56, 1.96, 0.42, hat, edge);
    hatCone(p, hat, [0.08, -1]);
    p.star(-0.14, 0.04, 0.2, 0.09, GOLD);
    p.star(0.22, -0.32, 0.13, 0.06, GOLD);
    p.star(0.24, 0.28, 0.12, 0.05, 0xfff1b8);
    p.arc(-0.06, 0.46, 0.14, 0, 360, 0xfff1b8, 0.8);
  },
  astronautHelmet: (p) => {
    p.circle(0, -0.1, 0.92, 0xf2f4fa, 0x7d8498);
    p.box(0, 0.74, 1.4, 0.3, 0.1, 0xc8d1dc, 0x7d8498);
    p.box(0, -0.06, 1.3, 0.72, 0.3, 0x2c4f7c, 0x7d8498, 0.45);
    p.line(-0.44, -0.22, -0.16, -0.3, WHITE, 1.1, 0.8);
    p.circle(0.82, -0.08, 0.14, RED);
  },
  goldenHalo: (p) => {
    p.glow(0, 0, 2.1, 1.1, 0xfff1b8, 0.22, 5);
    p.ring(0, 0, 1.56, 0.56, GOLD_EDGE, 3, 0.9);
    p.ring(0, 0, 1.56, 0.56, GOLD, 2.2, 1.4);
    p.ring(0, -0.03, 1.5, 0.5, 0xfff1b8, 0.8, 1.2);
    for (const [x, y] of [[-0.86, -0.42], [0.9, -0.36], [0, -0.68]]) p.star(x, y, 0.15, 0.04, 0xfff1b8, undefined, 4);
  },
  phoenixCrown: (p) => {
    crown(p, 0xff7a2f, 0xffe28a);
    p.poly([[0, -1], [0.22, -0.56], [0.08, -0.24], [-0.08, -0.24], [-0.22, -0.56]], 0xffc53d, 0xc84c12);
    for (const side of MIRROR) p.poly([[side * 0.72, -0.1], [side * 1, -0.82], [side * 0.46, -0.34]], 0xff5a2f, 0xc84c12);
  },

  // ---- glasses: unit = the cat's radius, (0, 0) = between the eyes, eyes at x = +-0.36 ----
  readingGlasses: (p) => roundLenses(p, 0.24, 0x7b4b2a, 0xdff4ff, 0.3),
  roundSpecs: (p) => roundLenses(p, 0.29, 0xe0a63a, 0xdff4ff, 0.25),
  coolShades: (p) => boxShades(p, 0.52, 0.36, 0x0e0e16, 0x1b1b26),
  bubblegumShades: (p) => {
    for (const side of MIRROR) {
      p.ellipse(side * 0.37, 0, 0.56, 0.42, PINK, shade(PINK, 0.5));
      p.line(side * 0.25, -0.08, side * 0.42, -0.1, WHITE, 0.9, 0.8);
      p.line(side * 0.65, -0.04, side * 0.97, -0.12, shade(PINK, 0.5), 1);
    }
    p.line(-0.1, -0.02, 0.1, -0.02, shade(PINK, 0.5), 1.2);
    p.circle(0.16, 0.56, 0.15, 0xffb3d4, shade(PINK, 0.6), 0.92);
    p.line(0.1, 0.5, 0.16, 0.47, WHITE, 0.6, 0.8);
  },
  spaceGoggles: (p) => {
    p.box(0, 0, 1.84, 0.18, 0.03, 0x4a5060, 0x2a2e3a);
    for (const side of MIRROR) {
      p.circle(side * 0.37, 0, 0.3, 0xc8d1dc, 0x6b7584);
      p.circle(side * 0.37, 0, 0.21, 0x5ce1ff, 0x2a8fb0, 0.85);
      p.line(side * 0.28, -0.1, side * 0.4, -0.13, WHITE, 0.9);
    }
    p.box(0, 0, 0.2, 0.14, 0.02, 0x6b7584);
  },
  falseLashes: (p) => lashes(p, 0x15101c),
  blackEye: (p) => {
    p.ellipse(-0.36, 0.02, 0.76, 0.72, 0xe9d36a, undefined, 0.35);
    p.ellipse(-0.36, 0.02, 0.62, 0.58, 0x4b3a78, undefined, 0.45);
    p.arc(-0.36, 0.02, 0.25, 0, 360, 0x35244f, 2.4, 0.9);
    p.box(0.68, -0.34, 0.26, 0.12, 0.05, 0xf2d3b0, 0xb78a62);
    p.box(0.68, -0.34, 0.08, 0.12, 0, 0xe0bb93);
  },
  tapeSpecs: (p) => {
    for (const side of MIRROR) {
      p.box(side * 0.37, 0, 0.5, 0.42, 0.06, 0xdff4ff, 0x15101c, 0.25);
      p.line(side * 0.62, -0.04, side * 0.97, -0.12, 0x15101c, 1);
    }
    p.box(0, -0.02, 0.28, 0.2, 0.03, WHITE, 0xb9c2d0);
    p.line(-0.05, -0.1, -0.05, 0.06, 0xb9c2d0, 0.7);
    p.line(0.05, -0.1, 0.05, 0.06, 0xb9c2d0, 0.7);
  },
  piratePatch: (p) => {
    p.line(-0.92, -0.44, 0.92, 0.2, 0x15101c, 1.3);
    p.line(0.08, -0.2, 0.92, -0.36, 0x15101c, 1.1);
    p.ellipse(0.37, -0.02, 0.5, 0.54, 0x15101c, 0x332a3a);
    p.circle(0.37, -0.08, 0.08, 0xeae6da);
    for (const side of MIRROR) p.line(0.37 - side * 0.09, 0.03, 0.37 + side * 0.09, 0.1, 0xeae6da, 0.6);
  },
  monocle: (p) => {
    p.circle(0.36, 0, 0.27, 0xdff4ff, undefined, 0.3);
    p.arc(0.36, 0, 0.27, 0, 360, GOLD, 1.4);
    p.arc(0.36, 0, 0.27, 0, 360, GOLD_EDGE, 0.5);
    p.line(0.27, -0.12, 0.42, -0.16, WHITE, 0.8);
    p.line(0.6, 0.14, 0.7, 0.44, GOLD_EDGE, 0.7);
    p.line(0.7, 0.44, 0.62, 0.78, GOLD_EDGE, 0.7);
    p.circle(0.6, 0.82, 0.05, GOLD);
  },
  heartShades: (p) => {
    for (const side of MIRROR) {
      p.heart(side * 0.38, 0, 0.3, 0xff3b6b, shade(0xff3b6b, 0.5));
      p.line(side * 0.3, -0.1, side * 0.4, -0.12, WHITE, 0.8, 0.8);
      p.line(side * 0.68, -0.08, side * 0.97, -0.13, shade(0xff3b6b, 0.5), 1);
    }
    p.line(-0.1, -0.04, 0.1, -0.04, shade(0xff3b6b, 0.5), 1.2);
  },
  sleepMask: (p) => {
    const mask = 0x9fb4ff;
    const edge = shade(mask, 0.55);
    p.line(-0.98, -0.08, 0.98, -0.08, edge, 1.4);
    p.poly([[-0.76, -0.2], [-0.34, -0.34], [0, -0.2], [0.34, -0.34], [0.76, -0.2], [0.72, 0.2], [0.34, 0.3], [0, 0.16], [-0.34, 0.3], [-0.72, 0.2]], mask, edge);
    for (const side of MIRROR) p.arc(side * 0.36, -0.1, 0.18, 30, 150, INK, 1.1);
  },
  threeDGlasses: (p) => {
    p.box(0, 0, 1.56, 0.5, 0.05, WHITE, 0xb9c2d0);
    p.box(-0.37, 0, 0.56, 0.34, 0.03, 0xff3b4e, 0xb91f30, 0.85);
    p.box(0.37, 0, 0.56, 0.34, 0.03, 0x3bb8ff, 0x1f78b9, 0.85);
    for (const side of MIRROR) p.line(side * 0.78, -0.08, side * 0.97, -0.14, 0xb9c2d0, 1);
  },
  starShades: (p) => {
    // dark star lenses in a gold frame: they read on every coat, where plain gold stars vanished on warm fur
    for (const side of MIRROR) {
      p.star(side * 0.38, 0.02, 0.38, 0.19, GOLD_EDGE);
      p.star(side * 0.38, 0.02, 0.34, 0.16, GOLD, GOLD_EDGE);
      p.star(side * 0.38, 0.03, 0.22, 0.1, 0x2b2233);
      p.line(side * 0.38 - 0.1, -0.06, side * 0.38 - 0.02, -0.09, WHITE, 0.7, 0.8);
      p.line(side * 0.7, -0.08, side * 0.97, -0.13, GOLD_EDGE, 1);
    }
    p.line(-0.1, -0.02, 0.1, -0.02, GOLD_EDGE, 1.2);
  },
  aviators: (p) => {
    for (const side of MIRROR) {
      p.poly([[side * 0.1, -0.16], [side * 0.66, -0.2], [side * 0.68, 0.06], [side * 0.5, 0.26], [side * 0.26, 0.26], [side * 0.1, 0.06]], 0x3d2c1c, GOLD);
      p.line(side * 0.26, -0.08, side * 0.46, -0.1, 0xffe0a8, 0.8, 0.7);
      p.line(side * 0.66, -0.18, side * 0.97, -0.14, GOLD, 0.9);
    }
    p.line(-0.1, -0.14, 0.1, -0.14, GOLD, 1);
    p.line(-0.08, -0.02, 0.08, -0.02, GOLD, 0.7);
  },
  masqueradeMask: (p) => {
    for (const side of MIRROR) {
      p.poly([[side * 0.68, -0.2], [side * 1, -0.62], [side * 0.96, -0.2], [side * 0.8, 0.06]], 0xe05fd0, 0x8f2f86);
      p.arc(side * 0.36, 0, 0.27, 0, 360, 0x6a2fb0, 3);
      p.arc(side * 0.36, 0, 0.34, 200, 340, GOLD, 0.8);
    }
    p.box(0, -0.02, 0.24, 0.16, 0.05, 0x6a2fb0);
    p.circle(0, -0.1, 0.05, GOLD);
  },
  cyberVisor: (p) => {
    p.box(0, 0, 1.76, 0.44, 0.18, 0x13233f, 0x5ce1ff);
    p.line(-0.68, 0, 0.68, 0, CYAN, 1.6, 0.9);
    p.line(-0.68, -0.1, -0.2, -0.1, WHITE, 0.7, 0.7);
    for (const side of MIRROR) p.circle(side * 0.36, 0, 0.07, WHITE);
  },
  diamondLashes: (p) => lashes(p, 0x2a8fb0, CYAN),
  laserVisor: (p) => {
    p.box(0, 0, 1.84, 0.4, 0.14, 0x2a1216, 0xff3b4e);
    p.box(0, 0, 1.56, 0.14, 0.06, 0xff3b4e);
    p.box(0, 0, 1.3, 0.05, 0.02, WHITE);
    for (const side of MIRROR) p.circle(side * 0.92, 0, 0.09, 0xff7a84, 0xff3b4e);
  },

  // ---- accessories ----
  tinyBell: (p) => {
    collarBand(p, RED);
    p.circle(0, 0.3, 0.44, GOLD, GOLD_EDGE);
    p.line(-0.42, 0.24, 0.42, 0.24, GOLD_EDGE, 0.8);
    p.circle(0, 0.46, 0.09, INK);
    p.line(0, 0.5, 0, 0.66, INK, 0.7);
    p.line(-0.2, 0.08, -0.08, 0.02, WHITE, 0.8, 0.7);
  },
  cozyScarf: (p) => scarfBand(p, 0xd9534f, 0xf3dfb6),
  goldMedal: (p) => {
    // a ribbon round the neck, the medal hanging from it
    collarBand(p, 0x4d7bd8, 0.3);
    for (const x of [-0.9, -0.45, 0.45, 0.9]) p.line(x - 0.05, CHIN(x) - 0.12, x + 0.05, CHIN(x) + 0.12, WHITE, 0.9, 0.8);
    p.poly([[-0.26, -0.06], [0.26, -0.06], [0.12, 0.26], [-0.12, 0.26]], 0x4d7bd8, shade(0x4d7bd8, 0.55));
    p.circle(0, 0.5, 0.46, GOLD, GOLD_EDGE);
    p.arc(0, 0.5, 0.36, 0, 360, GOLD_EDGE, 0.6, 0.7);
    p.star(0, 0.5, 0.24, 0.1, GOLD_EDGE);
  },
  diamondCollar: (p) => {
    collarBand(p, 0xdfe7f5);
    for (const x of [-0.98, -0.62, -0.31, 0.31, 0.62, 0.98]) gem(p, x, CHIN(x), 0.13);
    gem(p, 0, 0.14, 0.4);
  },
  luckyDuck: (p) => {
    p.ellipse(-0.08, 0.34, 1.34, 0.9, 0xffd93c, 0xc99a14);
    p.circle(0.34, -0.3, 0.42, 0xffd93c, 0xc99a14);
    p.poly([[0.68, -0.34], [1, -0.22], [0.68, -0.12]], 0xff9a3c);
    p.circle(0.44, -0.4, 0.06, INK);
    p.arc(-0.24, 0.2, 0.3, 20, 160, 0xc99a14, 0.8);
  },
  mouseToy: (p) => {
    p.arc(-1.02, 0.24, 0.42, -60, 40, 0xff9db8, 1.2);
    p.ellipse(0, 0.2, 1.4, 0.9, 0xb9c2d0, 0x6b7584);
    for (const [x, y] of [[0.36, -0.36], [-0.16, -0.36]]) { p.circle(x, y, 0.27, 0xb9c2d0, 0x6b7584); p.circle(x, y, 0.15, 0xffb3c1); }
    p.circle(0.68, 0.18, 0.09, 0xff8fa3);
    p.circle(0.36, 0.04, 0.06, INK);
  },
  catSocks: (p) => {
    for (const [x, c] of [[-0.42, 0xff78a8], [0.42, 0x5ce1ff]] as const) {
      const edge = shade(c, 0.55);
      p.box(x, -0.3, 0.56, 0.96, 0.04, c, edge);
      p.ellipse(x + 0.08, 0.42, 0.78, 0.56, c, edge);
      p.box(x, -0.7, 0.56, 0.16, 0.03, WHITE);
      p.circle(x + 0.1, 0.44, 0.1, WHITE);
    }
  },
  ducklingPond: (p) => {
    p.ellipse(0, 0.5, 1.96, 0.84, 0x58b8e8, 0x2f7ea6);
    p.ellipse(-0.3, 0.2, 0.86, 0.6, 0xffd93c, 0xc99a14);
    p.circle(0, -0.2, 0.3, 0xffd93c, 0xc99a14);
    p.poly([[0.26, -0.24], [0.5, -0.14], [0.26, -0.06]], 0xff9a3c);
    p.circle(0.08, -0.26, 0.05, INK);
    p.arc(0.54, 0.6, 0.18, 200, 340, WHITE, 0.8);
  },
  pizzaPlush: (p) => {
    p.poly([[-0.84, -0.64], [0.84, -0.64], [0, 0.98]], 0xffcf5a, 0xc98a2a);
    p.box(0, -0.68, 1.84, 0.28, 0.13, 0xc98a4a, 0x8a5a2a);
    for (const [x, y] of [[-0.3, -0.24], [0.28, -0.26], [0, 0.26]]) p.circle(x, y, 0.15, 0xe0523c);
  },
  roseClip: (p) => {
    p.leaf(-0.2, 0.3, 150, 0.7, 0.2, 0x5bbf5f);
    p.leaf(0.2, 0.3, 30, 0.7, 0.2, 0x5bbf5f);
    p.circle(0, -0.06, 0.62, 0xe0334f, 0x8f1c31);
    p.arc(0, -0.06, 0.38, 200, 480, 0x8f1c31, 1);
    p.arc(0.02, -0.04, 0.18, 0, 280, 0x8f1c31, 1);
  },
  tunaJuice: (p) => {
    p.box(0, 0.12, 1.2, 1.56, 0.08, 0x3f8fd8, 0x28609a);
    p.ellipse(-0.06, 0.2, 0.72, 0.38, WHITE);
    p.poly([[0.26, 0.2], [0.5, 0.02], [0.5, 0.38]], WHITE);
    p.line(0.3, -0.66, 0.5, -1, WHITE, 1.3);
    p.box(0, -0.66, 1.2, 0.18, 0.03, 0x28609a);
  },
  musicBox: (p) => {
    p.box(0, 0.32, 1.7, 1, 0.08, 0xb07c4f, 0x6f4a2a);
    p.poly([[-0.86, -0.18], [-0.66, -0.74], [0.66, -0.74], [0.86, -0.18]], 0xc99466, 0x6f4a2a);
    p.heart(0, 0.32, 0.24, GOLD);
    p.arc(0.98, 0.3, 0.14, 0, 360, GOLD_EDGE, 1.2);
  },
  luckyDice: (p) => {
    p.box(0, 0, 1.62, 1.62, 0.26, WHITE, 0xb9c2d0);
    for (const [x, y] of [[-0.42, -0.42], [0.42, -0.42], [0, 0], [-0.42, 0.42], [0.42, 0.42]]) p.circle(x, y, 0.15, RED);
  },
  gameController: (p) => {
    p.box(0, 0, 1.92, 1.06, 0.44, 0x4a5060, 0x2a2e3a);
    p.box(-0.48, 0, 0.44, 0.14, 0.02, WHITE);
    p.box(-0.48, 0, 0.14, 0.44, 0.02, WHITE);
    for (const [x, y, c] of [[0.34, 0.14, RED], [0.62, -0.1, 0x5ce1ff]] as const) p.circle(x, y, 0.14, c);
  },
  partyPopper: (p) => {
    p.poly([[-0.9, 0.9], [-0.36, -0.3], [0.3, 0.38]], 0x5ce1ff, CYAN_EDGE);
    p.line(-0.6, 0.2, -0.16, 0.62, WHITE, 1);
    [[0.34, -0.72, PINK], [0.82, -0.26, GOLD], [0.76, 0.5, 0x5bd77a], [-0.14, -0.72, 0xff9a3c], [0.3, -0.2, RED]].forEach(([x, y, c]) => p.circle(x, y, 0.13, c));
  },
  diamondRing: (p) => {
    p.arc(0, 0.34, 0.54, 0, 360, GOLD, 2.2);
    gem(p, 0, -0.5, 0.46);
  },
  rainbowCollar: (p) => {
    [0xff5a5f, 0xffd93c, 0x5bd77a, 0x4da3ff].forEach((c, k) => band(p, chin(-0.2 + k * 0.14), 1.3 - k * 0.012, 0.15, c));
    p.circle(0, 0.42, 0.3, GOLD, GOLD_EDGE);
    p.star(0, 0.42, 0.17, 0.07, GOLD_EDGE);
  },
  soccerBall: (p) => {
    p.circle(0, 0, 0.92, WHITE, 0x4a5060);
    p.star(0, -0.02, 0.32, 0.27, INK, undefined, 5);
    for (let k = 0; k < 5; k++) {
      const a = Phaser.Math.DegToRad(-90 + k * 72);
      p.line(Math.cos(a) * 0.3, -0.02 + Math.sin(a) * 0.3, Math.cos(a) * 0.72, Math.sin(a) * 0.72, INK, 0.9);
      p.circle(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0.13, INK);
    }
  },
  catPhone: (p) => {
    for (const side of MIRROR) p.poly([[side * 0.3, -0.84], [side * 0.68, -0.84], [side * 0.56, -1.06]], 0x2a2e3a);
    p.box(0, 0, 1.2, 1.8, 0.16, 0x2a2e3a, 0x12141c);
    p.box(0, -0.04, 1, 1.44, 0.03, 0x8fd3ff);
    paw(p, 0, -0.02, 0.28, WHITE);
    p.circle(0, 0.78, 0.06, 0x8a92a6);
  },
  gooseParade: (p) => {
    goose(p, 0xf2f4fa, -0.42, 0.14, 0.54);
    goose(p, WHITE, 0.3, 0.24, 0.66);
  },
  gamingLaptop: (p) => {
    p.box(0, -0.22, 1.56, 1.1, 0.06, 0x2a2e3a, 0x12141c);
    p.box(0, -0.22, 1.36, 0.9, 0.02, 0x1a2a44);
    for (const [y, c] of [[-0.46, 0x5bd77a], [-0.24, PINK], [-0.02, CYAN]] as const) p.line(-0.48, y, 0.18, y, c, 1);
    p.poly([[-0.84, 0.36], [0.84, 0.36], [1, 0.76], [-1, 0.76]], 0x4a5060, 0x12141c);
  },
  sushiPlush: (p) => {
    p.box(0, 0.32, 1.72, 0.74, 0.2, WHITE, 0xb9c2d0);
    p.poly([[-0.92, 0.1], [-0.56, -0.5], [0.6, -0.56], [0.94, 0.1]], 0xff8a5c, 0xc85a30);
    for (const x of [-0.34, 0.06, 0.46]) p.line(x, -0.42, x - 0.1, 0.02, 0xffd0b8, 1);
    p.box(0, 0.38, 0.36, 0.8, 0.02, 0x20402c);
  },
  goldenGoose: (p) => {
    goose(p, GOLD);
    p.star(-0.5, -0.5, 0.2, 0.05, 0xfff1b8, undefined, 4);
  },
  drumSolo: (p) => {
    p.ellipse(0, 0.62, 1.7, 0.44, 0xd9534f, 0x8f2f2c);
    p.box(0, 0.22, 1.7, 0.8, 0, 0xd9534f);
    for (const side of MIRROR) p.line(side * 0.85, -0.18, side * 0.85, 0.62, 0x8f2f2c, 1);
    for (const x of [-0.5, 0, 0.5]) p.line(x, -0.14, x + 0.22, 0.66, GOLD, 0.9);
    p.ellipse(0, -0.18, 1.7, 0.44, 0xf7f4ea, 0x9a927c);
    for (const side of MIRROR) p.line(side * 0.08, -0.26, side * 0.82, -0.94, 0xc99466, 1.4);
  },
  purrfectPC: (p) => {
    p.box(-0.26, -0.28, 1.34, 1.08, 0.08, 0xf2f4fa, 0x7d8498);
    p.box(-0.26, -0.3, 1.1, 0.82, 0.03, 0x2c4f7c);
    catHead(p, -0.26, -0.26, 0.26, FUR, 'happy');
    p.box(-0.26, 0.46, 0.3, 0.3, 0, 0xc8d1dc);
    p.box(-0.26, 0.68, 0.84, 0.16, 0.04, 0xc8d1dc, 0x7d8498);
    p.box(0.72, 0.12, 0.42, 1.34, 0.05, 0x2a2e3a, 0x12141c);
    for (const y of [-0.36, -0.12]) p.line(0.58, y, 0.86, y, CYAN, 1);
    p.circle(0.72, 0.56, 0.06, 0x5bd77a);
  },
  treasureChest: (p) => {
    const wood = 0x9a6233;
    const edge = shade(wood, 0.5);
    p.box(0, 0.42, 1.84, 0.94, 0.06, wood, edge);
    p.poly([[-0.92, -0.04], [-0.8, -0.6], [-0.4, -0.84], [0.4, -0.84], [0.8, -0.6], [0.92, -0.04]], shade(wood, 1), edge);
    for (const x of [-0.56, 0.56]) p.box(x, 0, 0.16, 1.7, 0.02, GOLD, GOLD_EDGE);
    p.box(0, -0.04, 1.84, 0.12, 0, GOLD_EDGE);
    p.box(0, 0.08, 0.3, 0.36, 0.04, GOLD, GOLD_EDGE);
  },
  luckyClover: (p) => {
    const leaf = 0x5bbf5f;
    p.line(0.02, 0.2, 0.3, 0.96, 0x3e8f42, 1.6);
    for (const [x, y] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.34], [0.42, 0.34]]) p.heart(x, y, 0.42, leaf, shade(leaf, 0.6));
    p.circle(0, -0.04, 0.09, 0x3e8f42);
  },
  crystalBall: (p) => {
    p.poly([[-0.48, 0.56], [0.48, 0.56], [0.7, 0.96], [-0.7, 0.96]], 0x7b4b2a, 0x4f2f18);
    p.circle(0, -0.14, 0.82, 0xb06bff, 0x6a2fb0, 0.9);
    p.ellipse(0.08, 0, 0.8, 0.36, 0xffb3e0, undefined, 0.5);
    p.star(0.2, -0.3, 0.2, 0.05, WHITE, undefined, 4);
    p.arc(-0.1, -0.24, 0.56, 190, 260, WHITE, 1.2, 0.8);
  },
  prismPin: (p) => {
    p.poly([[0, -0.94], [0.84, -0.3], [0.5, 0.82], [-0.5, 0.82], [-0.84, -0.3]], 0x4d7bff, 0x274a8f);
    p.poly([[0, -0.94], [0.42, -0.1], [0, 0.82], [-0.42, -0.1]], 0x8fb3ff);
    p.poly([[0, -0.94], [-0.42, -0.1], [-0.84, -0.3]], 0xc4d6ff);
    p.star(0.4, -0.5, 0.16, 0.04, WHITE, undefined, 4);
  },
  starlightScarf: (p) => {
    scarfBand(p, 0x2a2f7c, 0x8fa0ff);
    for (const [x, y] of [[-0.7, CHIN(-0.7)], [-0.22, CHIN(-0.22)], [0.58, 0.56]]) p.star(x, y, 0.15, 0.065, GOLD);
  },
  fishBone: (p) => {
    // a dark under-stroke keeps the bone readable on pale fur, where it is carried in the mouth
    const bone = 0xf7f8fc;
    const rim = 0x5d6577;
    p.line(-0.56, 0, 0.56, 0, rim, 2.6);
    for (const x of [-0.24, 0.04, 0.32]) p.line(x, -0.34, x, 0.34, rim, 2.1);
    p.poly([[-0.98, 0], [-0.48, -0.36], [-0.48, 0.36]], bone, rim);
    p.poly([[0.5, 0], [0.96, -0.34], [0.96, 0.34]], bone, rim);
    p.line(-0.56, 0, 0.56, 0, bone, 1.5, 1.4);
    for (const x of [-0.24, 0.04, 0.32]) p.line(x, -0.32, x, 0.32, bone, 1.1, 1.4);
    p.circle(-0.68, -0.05, 0.06, INK);
  },
  bowTie: (p) => {
    const tie = 0xd9334f;
    const edge = shade(tie, 0.55);
    collarBand(p, 0xfdf6ee, 0.2);
    for (const side of MIRROR) {
      p.poly([[side * 0.12, -0.08], [side * 0.9, -0.46], [side * 0.9, 0.52], [side * 0.12, 0.16]], tie, edge);
      p.poly([[side * 0.2, 0.04], [side * 0.66, -0.18], [side * 0.66, 0.26]], shade(tie, 0.8));
      p.circle(side * 0.74, 0.04, 0.06, WHITE);
    }
    p.box(0, 0.04, 0.32, 0.38, 0.08, shade(tie, 0.86), edge);
  },
  yarnToy: (p) => {
    const wool = 0xff9ac2;
    p.arc(-0.62, 0.42, 0.34, 20, 170, wool, 1.5);
    p.line(-0.96, 0.46, -0.96, 0.86, wool, 1.5);
    p.circle(0.16, -0.08, 0.72, wool, shade(wool, 0.5));
    for (const radius of [0.44, 0.66]) p.arc(-0.44, -0.08, radius, -48, 48, shade(wool, 0.68), 0.9);
    p.arc(0.16, -0.72, 0.48, 50, 130, shade(wool, 0.68), 0.9);
    p.ellipse(-0.08, -0.34, 0.34, 0.18, WHITE, undefined, 0.4);
  },
  spikedCollar: (p) => {
    for (const x of [-0.98, -0.66, -0.33, 0, 0.33, 0.66, 0.98]) p.poly([[x - 0.11, CHIN(x) + 0.08], [x + 0.11, CHIN(x) + 0.08], [x * 1.04, CHIN(x) + 0.56]], 0xc8d1dc, 0x6b7584);
    collarBand(p, 0x2a2536);
    for (const x of [-0.98, -0.66, -0.33, 0, 0.33, 0.66, 0.98]) p.circle(x, CHIN(x), 0.055, 0xc8d1dc, 0x6b7584);
  },
  pearlNecklace: (p) => {
    // a string that follows the jaw and dips in the middle, the pearls growing toward the center
    for (let k = 0; k <= 12; k++) {
      const x = -1.26 + (k / 12) * 2.52;
      const dip = 1 - (x / 1.26) ** 2;
      const s = 0.1 + dip * 0.05;
      p.circle(x, CHIN(x) + 0.06 + dip * 0.3, s, 0xfdf6ee, 0xc8bca8);
      p.circle(x - s * 0.3, CHIN(x) + 0.06 + dip * 0.3 - s * 0.3, s * 0.28, WHITE);
    }
  },
  featherWand: (p) => {
    p.line(-0.76, 0.9, 0.12, -0.04, 0x9a6233, 1.5);
    p.leaf(0.04, 0.04, -38, 0.92, 0.26, 0xff78e0);
    p.leaf(0.04, 0.04, -68, 0.92, 0.22, 0x5ce1ff);
    p.leaf(0.04, 0.04, -8, 0.88, 0.2, 0xffd93c);
  },
  pocketWatch: (p) => {
    p.line(0, -0.74, 0.5, -1, GOLD_EDGE, 0.9);
    p.circle(0, 0.14, 0.78, GOLD, GOLD_EDGE);
    p.circle(0, 0.14, 0.58, 0xfdf6ee, GOLD_EDGE);
    p.circle(0, -0.74, 0.11, GOLD, GOLD_EDGE);
    p.line(0, 0.14, 0, -0.26, INK, 1.1);
    p.line(0, 0.14, 0.24, 0.26, INK, 1.1);
  },
  goldenBell: (p) => {
    collarBand(p, GOLD);
    p.poly([[0, -0.2], [0.3, 0.0], [0.4, 0.46], [0.6, 0.7], [-0.6, 0.7], [-0.4, 0.46], [-0.3, 0.0]], 0xffdf80, GOLD_EDGE);
    p.circle(0, 0.82, 0.12, 0xd98a1f, GOLD_EDGE);
    p.line(-0.18, 0.1, -0.26, 0.5, WHITE, 0.9, 0.6);
    p.star(0.46, 0.0, 0.16, 0.04, WHITE, undefined, 4);
  },
  angelWings: (p) => {
    // a pair spread behind the cat: the head covers the gap in the middle. Long flight feathers, shorter ones over them.
    for (const side of MIRROR) {
      // one feather: a petal with a blunt tip, growing from the shoulder at `angle`
      const feather = (angle: number, length: number, half: number, color: number) => {
        const a = Phaser.Math.DegToRad(side > 0 ? angle : 180 - angle);
        const at = (u: number, v: number): Point => [side * 0.3 + Math.cos(a) * u * length - Math.sin(a) * v * half, -0.06 + Math.sin(a) * u * length + Math.cos(a) * v * half];
        p.poly([at(0, -0.4), at(0.5, -1), at(0.86, -0.9), at(1, 0), at(0.86, 0.9), at(0.5, 1), at(0, 0.4)], color, 0xb4c0d8);
      };
      for (const [angle, length] of [[62, 0.4], [40, 0.54], [18, 0.64], [-4, 0.7], [-26, 0.74], [-48, 0.7]]) feather(angle, length, 0.085, 0xdfe7f5);
      for (const [angle, length] of [[50, 0.3], [27, 0.4], [4, 0.46], [-19, 0.5], [-42, 0.48]]) feather(angle, length, 0.075, WHITE);
      p.ellipse(side * 0.44, -0.1, 0.34, 0.28, WHITE, 0xb4c0d8);
    }
  },
  cosmicCollar: (p) => {
    collarBand(p, 0x1f1a4d);
    for (const [x, c] of [[-1.0, 0xb06bff], [-0.62, 0xff78e0], [-0.3, CYAN], [0.3, GOLD], [0.62, 0xb06bff], [1.0, 0xff78e0]] as const) p.circle(x, CHIN(x), 0.07, c);
    p.glow(0, 0.34, 1.2, 1.2, 0xb06bff, 0.4, 4);
    p.circle(0, 0.34, 0.42, 0x1f1a4d, 0xb06bff);
    p.ellipse(0, 0.34, 0.7, 0.2, 0xb06bff, undefined, 0.5);
    p.star(0, 0.34, 0.18, 0.05, WHITE, undefined, 4);
  },

  // ---- specials: fan tributes ----
  wizardSpecs: (p) => {
    roundLenses(p, 0.24, 0x2b1e2f, 0xdfe9f5, 0.35);
    // the famous lightning scar, just above the left lens
    p.poly([[-0.5, -0.72], [-0.36, -0.5], [-0.46, -0.48], [-0.3, -0.28], [-0.42, -0.46], [-0.32, -0.48]], GOLD, GOLD_EDGE);
  },
  houseScarf: (p) => scarfBand(p, 0x9b1b30, GOLD),
  webMask: (p) => {
    const red = 0xd7263d;
    const edge = shade(red, 0.55);
    p.box(0, -0.02, 1.9, 0.86, 0.4, red, edge);
    for (const side of MIRROR) {
      p.poly([[side * 0.12, -0.08], [side * 0.7, -0.3], [side * 0.62, 0.2], [side * 0.18, 0.12]], WHITE, INK);
    }
    for (const x of [-0.84, -0.42, 0, 0.42, 0.84]) p.line(0, -0.02, x, x === 0 ? -0.44 : 0.4, INK, 0.5, 0.6);
    p.arc(0, -0.02, 0.5, 180, 360, INK, 0.5, 0.6);
    p.arc(0, -0.02, 0.8, 180, 360, INK, 0.5, 0.6);
  },
  monsterBall: (p) => {
    p.circle(0, 0, 0.9, WHITE, INK);
    p.poly([[-0.9, 0], [-0.78, -0.45], [-0.45, -0.78], [0, -0.9], [0.45, -0.78], [0.78, -0.45], [0.9, 0]], RED, INK);
    p.box(0, 0, 1.8, 0.16, 0.02, INK);
    p.circle(0, 0, 0.28, WHITE, INK);
    p.circle(0, 0, 0.13, 0xf2f2f2, INK);
    p.line(-0.42, -0.5, -0.2, -0.62, WHITE, 1, 0.7);
  },
  arcReactor: (p) => {
    collarBand(p, 0x6b6f7a);
    p.glow(0, 0.34, 1.3, 1.3, CYAN, 0.55);
    p.circle(0, 0.34, 0.46, 0x3a3f4a, 0x1d2027);
    p.ring(0, 0.34, 0.66, 0.66, CYAN, 1.6);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      p.line(Math.cos(a) * 0.18, 0.34 + Math.sin(a) * 0.18, Math.cos(a) * 0.3, 0.34 + Math.sin(a) * 0.3, CYAN, 1);
    }
    p.circle(0, 0.34, 0.14, 0xe8fdff);
  },
  heroCrest: (p) => {
    collarBand(p, 0x1f5fbf);
    p.poly([[-0.5, -0.02], [0.5, -0.02], [0.66, 0.2], [0, 0.86], [-0.66, 0.2]], GOLD, 0xb88a1c);
    p.poly([[-0.38, 0.06], [0.38, 0.06], [0.5, 0.22], [0, 0.72], [-0.5, 0.22]], RED);
    // a stylized curl instead of a letter
    p.arc(0.02, 0.24, 0.16, 200, 430, GOLD, 1.4);
    p.arc(-0.02, 0.48, 0.14, 20, 250, GOLD, 1.4);
  },
  sweetroll: (p) => {
    const bun = 0xd99a52;
    p.ellipse(0, 0.2, 1.7, 1, bun, shade(bun, 0.6));
    p.ellipse(0, -0.02, 1.5, 0.7, 0xfdf6ec, 0xd8cbb8);
    for (const [x, y] of [[-0.6, 0.18], [-0.24, 0.3], [0.2, 0.28], [0.58, 0.16]]) p.circle(x, y, 0.12, 0xfdf6ec);
    p.arc(0, -0.04, 0.22, 0, 300, 0xd8cbb8, 1);
  },
  laserSword: (p) => {
    p.glow(0, -0.36, 0.5, 1.6, 0x6df7ff, 0.5);
    p.line(0, 0.5, 0, -1.04, 0x9ffcff, 3.2);
    p.line(0, 0.5, 0, -1.04, WHITE, 1.4);
    p.box(0, 0.76, 0.18, 0.5, 0.04, 0xb7bcc6, 0x6b7584);
    for (const y of [0.66, 0.78, 0.9]) p.line(-0.09, y, 0.09, y, INK, 0.8);
    p.circle(0, 0.56, 0.07, RED);
  },
  dragonbornHelmet: (p) => {
    const iron = 0x8a8f99;
    const edge = shade(iron, 0.5);
    for (const side of MIRROR) p.poly([[side * 0.9, -0.92], [side * 1.32, -1.2], [side * 1.36, -1.72], [side * 1.14, -1.34], [side * 0.8, -1.2]], 0xe8dcc0, 0x9a8a6a);
    const opening: Point[] = [[-0.66, 0.66], [-0.6, 0.1], [-0.64, -0.36], [-0.09, -0.4], [-0.07, 0.04], [0.07, 0.04], [0.09, -0.4], [0.64, -0.36], [0.6, 0.1], [0.66, 0.66]];
    helmetShell(p, iron, edge, opening, -1.44, 1.1);
    p.box(0, -0.46, 2.28, 0.15, 0.05, shade(iron, 0.72), edge);
    for (const x of [-0.98, -0.74, -0.3, 0.3, 0.74, 0.98]) p.circle(x, -0.46, 0.04, 0x3b2f2a);
    p.line(0, -1.42, 0, -0.56, shade(iron, 0.7), 1.6);
    p.arc(-0.1, -0.3, 1.02, 210, 255, WHITE, 1.8, 0.4);
    for (const side of MIRROR) p.line(side * 0.84, 0.0, side * 0.9, 0.6, shade(iron, 0.75), 1, 0.7);
  },
  darkLordHelmet: (p) => {
    const black = 0x141218;
    const shine = 0x5a5468;
    const steel = 0x9aa0ab;
    // bell-shaped skirt: snug at the temples, sweeping wide and low behind the cheeks
    const outer: Point[] = [[-1.62, 1.02], [-1.4, 0.62], [-1.2, 0.18], [-1.18, -0.5], [-0.98, -1.1], [-0.56, -1.44], [0, -1.54],
      [0.56, -1.44], [0.98, -1.1], [1.18, -0.5], [1.2, 0.18], [1.4, 0.62], [1.62, 1.02]];
    // opening: angled frowning brows meeting in a peak, cheek guards narrowing toward the chin
    const opening: Point[] = [[0.78, 1.0], [0.68, 0.3], [0.68, -0.28], [0.16, -0.46], [0, -0.3], [-0.16, -0.46], [-0.68, -0.28], [-0.68, 0.3], [-0.78, 1.0]];
    p.poly([...outer, ...opening], black, shine);
    // dome ridge and the rim where the dome meets the skirt
    p.line(0, -1.52, 0, -0.5, shine, 1.2, 0.8);
    for (const side of MIRROR) {
      p.poly([[side * 0.16, -0.46], [side * 0.68, -0.28], [side * 0.74, -0.4], [side * 0.2, -0.6]], 0x2a2632, shine); // brow ridge
      p.line(side * 1.18, -0.44, side * 0.74, -0.38, shine, 1, 0.8);
      p.line(side * 1.2, 0.18, side * 1.58, 0.96, shine, 0.8, 0.5); // skirt edge highlight
      p.line(side * 0.86, 0.1, side * 1.3, 0.86, shine, 0.7, 0.4);
      p.poly([[side * 0.68, 0.36], [side * 0.9, 0.56], [side * 0.78, 1.0]], steel, shade(steel, 0.5)); // cheek plate
    }
    p.arc(-0.1, -0.2, 1.08, 205, 255, WHITE, 1.8, 0.3);
  },
  chaosPlush: (p) => {
    const hair = 0x3fa9f5;
    // two long braids
    for (const side of MIRROR) {
      p.line(side * 0.38, -0.2, side * 0.62, 0.9, hair, 3);
      for (const y of [0.1, 0.4, 0.7]) p.circle(side * (0.44 + y * 0.2), y, 0.09, shade(hair, 0.75));
    }
    p.circle(0, -0.3, 0.46, 0xf5d6c6, shade(0xf5d6c6, 0.6));
    p.poly([[-0.46, -0.36], [-0.3, -0.78], [0.3, -0.78], [0.46, -0.36], [0.2, -0.5], [0, -0.42], [-0.2, -0.5]], hair, shade(hair, 0.6));
    for (const side of MIRROR) p.circle(side * 0.16, -0.26, 0.07, 0xff4fa3);
    p.arc(0, -0.14, 0.12, 20, 160, INK, 0.8);
    p.box(0, 0.42, 0.66, 0.6, 0.16, 0x7a3fb0, shade(0x7a3fb0, 0.6));
  },
  warPaint: (p) => {
    // an original warrior's stripe: a bold red band from brow to chin across one eye, with a forehead streak
    const paint = 0xc8202a;
    p.poly([[0.16, -0.78], [0.42, -0.8], [0.5, -0.2], [0.56, 0.3], [0.46, 0.78], [0.28, 0.74], [0.3, 0.3], [0.22, -0.2]], paint, undefined, 0.85);
    p.poly([[-0.1, -0.74], [0.16, -0.78], [0.22, -0.56], [-0.04, -0.52]], paint, undefined, 0.85);
    p.line(0.34, -0.06, 0.66, 0.02, paint, 1.6, 0.85);
  },
  mouseEars: (p) => {
    // worn on the head, in head units: a band hugging the skull, two round ears standing on it
    mouseEarBand(p);
  },
  bowMouseEars: (p) => {
    mouseEarBand(p);
    const bow = 0xe2263b;
    const bowEdge = shade(bow, 0.55);
    for (const side of MIRROR) {
      p.poly([[side * 0.06, -1.0], [side * 0.5, -1.3], [side * 0.58, -0.98], [side * 0.5, -0.7]], bow, bowEdge);
      for (const [x, y] of [[0.3, -1.08], [0.42, -0.9], [0.22, -0.9]]) p.circle(side * x, y, 0.045, WHITE);
    }
    p.box(0, -0.99, 0.2, 0.26, 0.08, shade(bow, 0.86), bowEdge);
  },
  heroCard: (p) => {
    p.box(0, 0, 1.3, 1.8, 0.14, 0x8a5a2b, 0x4a2f14);
    p.box(0, -0.28, 1.04, 0.84, 0.4, 0x6fb7e8, 0x3b2610);
    catHead(p, 0, -0.22, 0.28);
    p.box(0, 0.3, 1.1, 0.2, 0.06, 0xe9d3a0, 0x8a6a3a);
    p.box(0, 0.62, 0.9, 0.34, 0.04, 0xf3e6c8);
    p.circle(-0.56, -0.8, 0.2, 0x3b7bff, 0x1c3d8a);
    p.circle(-0.52, 0.78, 0.18, GOLD, GOLD_EDGE);
    p.circle(0.52, 0.78, 0.18, RED, shade(RED, 0.55));
  },
  tycoonStatue: (p) => {
    // an original tycoon: a cat in a top hat with a moustache, cast in gold
    p.box(0, 0.78, 1.3, 0.3, 0.06, 0x6b4a2b, 0x3b2610);
    p.box(0, 0.36, 0.7, 0.6, 0.14, GOLD, GOLD_EDGE);
    catHead(p, 0, -0.24, 0.34, GOLD);
    p.box(0, -0.74, 0.44, 0.42, 0.04, shade(GOLD, 0.82), GOLD_EDGE);
    p.box(0, -0.6, 0.44, 0.1, 0, GOLD_EDGE);
    p.box(0, -0.54, 0.74, 0.1, 0.03, shade(GOLD, 0.82), GOLD_EDGE);
    for (const side of MIRROR) p.arc(side * 0.12, -0.12, 0.1, side > 0 ? 180 : 270, side > 0 ? 270 : 360, INK, 1.2);
  },
  bobblehead: (p) => {
    // an original bobblehead: a big-headed cat in a blue work jumpsuit with a cog badge
    p.box(0, 0.82, 1.1, 0.24, 0.06, 0x4a5060, 0x2a2e3a);
    p.box(0, 0.44, 0.5, 0.56, 0.14, 0x2f6fd6, 0x1a3f7a);
    p.box(0, 0.44, 0.08, 0.56, 0, 0xffc93c);
    p.line(0, 0.12, 0, 0, 0x8a92a6, 1.4);
    catHead(p, 0, -0.38, 0.5, 0xd8b48a, 'happy');
    p.circle(0.12, 0.36, 0.08, 0xb9c2d0, 0x6b7584);
  },
  pixelSword: (p) => pixels(p, [
    '.......kk',
    '......kck',
    '.....kcwk',
    '....kcwk.',
    '.k.kcwk..',
    '.kbkck...',
    '..kbk....',
    '.bkkbk...',
    'bb...k...',
  ]),
  pixelAxe: (p) => pixels(p, [
    '....kkk..',
    '...kccck.',
    '..kcwcck.',
    '..kccbk..',
    '...kbck..',
    '..bb.k...',
    '.bb......',
    'bb.......',
    'b........',
  ]),
  blockPig: (p) => {
    // an original plush: a chunky pink pig made of soft blocks
    const pink = 0xf6a3b8;
    const edge = shade(pink, 0.6);
    for (const x of [-0.5, -0.1, 0.3, 0.6]) p.box(x, 0.74, 0.22, 0.32, 0.04, shade(pink, 0.85), edge);
    p.box(0.02, 0.32, 1.5, 0.66, 0.12, pink, edge);
    p.box(-0.5, -0.32, 0.86, 0.8, 0.12, pink, edge);
    p.box(-0.5, -0.16, 0.44, 0.28, 0.06, 0xff8fa8, edge);
    for (const x of [-0.6, -0.4]) p.box(x, -0.16, 0.08, 0.1, 0, edge);
    for (const x of [-0.78, -0.22]) { p.box(x, -0.48, 0.14, 0.14, 0, WHITE); p.box(x + 0.03, -0.46, 0.07, 0.08, 0, INK); }
    p.arc(0.84, 0.16, 0.12, 180, 450, edge, 1);
  },
  redGuitar: (p) => {
    // a cherry-red double-cutaway electric guitar standing upright, no logo
    const body = 0xb3121e;
    const edge = 0x5a0a10;
    p.box(0, -0.42, 0.14, 1.06, 0.02, 0x5a3a20, 0x2a1a10);
    for (let k = 0; k < 5; k++) p.line(-0.07, -0.86 + k * 0.2, 0.07, -0.86 + k * 0.2, 0xd8d8d8, 0.5);
    p.box(0, -1, 0.24, 0.24, 0.06, 0x2a1a10);
    p.poly([[-0.52, 0.98], [0.52, 0.98], [0.6, 0.6], [0.42, 0.34], [0.5, 0.06], [0.34, -0.02], [0.16, 0.12], [-0.16, 0.12], [-0.34, -0.02], [-0.5, 0.06], [-0.42, 0.34], [-0.6, 0.6]], body, edge);
    p.box(0, 0.4, 0.34, 0.44, 0.08, 0x1a1a1a, undefined, 0.55);
    for (const y of [0.3, 0.52]) p.box(0, y, 0.3, 0.08, 0.02, 0x1a1a1a, 0xd8d8d8);
    p.box(0, 0.74, 0.3, 0.06, 0.02, 0xd8d8d8);
    for (const [x, y] of [[0.3, 0.68], [0.42, 0.84], [0.18, 0.86]]) p.circle(x, y, 0.05, GOLD);
    for (const x of [-0.04, 0, 0.04]) p.line(x, -0.88, x, 0.74, 0xeeeeee, 0.3, 0.8);
  },
  mohawk: (p) => {
    // a crest of spikes down the middle of the head, in head units: it starts above the brow and never crosses the face
    const hair = 0xff3b8a;
    const edge = shade(hair, 0.55);
    p.poly([[-0.17, -0.56], [-0.3, -0.98], [-0.56, -1.26], [-0.28, -1.2], [-0.34, -1.64], [-0.1, -1.36], [0, -1.86], [0.1, -1.36], [0.34, -1.64], [0.28, -1.2], [0.56, -1.26], [0.3, -0.98], [0.17, -0.56]], hair, edge);
    const light = mix(hair, WHITE, 0.4);
    p.line(-0.02, -0.8, -0.01, -1.6, light, 1.1, 0.8);
    p.line(-0.14, -0.84, -0.28, -1.42, light, 0.9, 0.7);
    p.line(0.12, -0.84, 0.26, -1.42, shade(hair, 0.75), 0.9, 0.8);
    p.line(-0.2, -0.96, -0.42, -1.18, light, 0.8, 0.6);
    p.line(0.2, -0.96, 0.42, -1.18, shade(hair, 0.75), 0.8, 0.8);
  },
  afro: (p) => {
    // a cloud of curls over the top of the head, in head units: the hairline stays above the eyes, the sides frame the face
    const hair = 0x4a2c1a;
    const edge = shade(hair, 0.55);
    const curls: Point[] = [];
    for (let k = 0; k <= 11; k++) {
      const a = Phaser.Math.DegToRad(160 + k * 20);
      curls.push([Math.cos(a) * 1.02, -0.66 + Math.sin(a) * 0.78]);
    }
    for (const [x, y] of curls) p.circle(x, y, 0.33, hair, edge);
    p.ellipse(0, -0.96, 2.0, 1.02, hair);
    for (const x of [-0.62, -0.31, 0, 0.31, 0.62]) p.circle(x, -0.6, 0.19, hair, edge);
    p.ellipse(0, -0.86, 1.56, 0.62, hair);
    // loose curls catch the light
    const shine = mix(hair, WHITE, 0.22);
    for (const [x, y, s] of [[-0.6, -1.24, 0.16], [-0.14, -1.42, 0.18], [0.36, -1.3, 0.16], [0.78, -1.0, 0.14], [-0.88, -0.84, 0.14], [0.08, -0.98, 0.15], [-0.36, -0.92, 0.13], [0.5, -0.84, 0.13]]) {
      p.arc(x, y, s, 190, 330, shine, 0.9, 0.8);
    }
  },
  quiff: (p) => {
    // slicked sides and a tall wave rolling forward, in head units; the hairline clears the eyes
    const hair = 0x2a1d17;
    const edge = shade(hair, 0.5);
    p.poly([[-0.93, -0.16], [-0.99, -0.56], [-0.82, -1.0], [-0.44, -1.3], [0.16, -1.54], [0.74, -1.5], [1.04, -1.22], [0.86, -0.98], [0.98, -0.58], [0.93, -0.16], [0.8, -0.4], [0.44, -0.6], [0, -0.54], [-0.42, -0.46], [-0.8, -0.38]], hair, edge);
    // the roll at the front
    p.poly([[-0.3, -0.62], [-0.1, -1.1], [0.36, -1.36], [0.84, -1.3], [0.98, -1.08], [0.66, -0.9], [0.4, -0.66], [0, -0.56]], shade(hair, 1.25), edge);
    const shine = 0x8fa0c8;
    p.arc(0.36, -0.82, 0.46, 215, 300, shine, 1.3, 0.55);
    p.arc(0.4, -0.78, 0.28, 220, 300, shine, 0.8, 0.4);
    p.line(-0.78, -0.86, -0.58, -0.5, shade(hair, 1.5), 0.8, 0.6);
    p.line(-0.6, -1.04, -0.36, -0.56, shade(hair, 1.5), 0.8, 0.6);
  },
};

/** Draws the named icon into an existing Graphics at radius r. `lineScale` thins its strokes (see pen). */
export function paintIcon(g: Phaser.GameObjects.Graphics, r: number, name: IconName, lineScale = 1) {
  ICONS[name](pen(g, r, lineScale), g);
}

/**
 * Custom icon of radius r centered at (x, y). Glasses are spread wider than one radius, and whatever is drawn
 * round the head uses the head's own units, so both are scaled (and the latter re-centered) to fit an icon.
 */
export function drawIcon(scene: Phaser.Scene, x: number, y: number, r: number, name: IconName) {
  const g = scene.add.graphics();
  const [scale, dy] = HEAD_UNIT_ICONS[name] ?? [FACE_ICONS.has(name) ? 1.08 : 1, 0];
  paintIcon(g, r * scale, name);
  g.y = dy * r;
  return scene.add.container(x, y, [g]);
}

/**
 * Icons drawn in the units they are worn in (round the head, or along the chin): [scale, vertical offset in icon
 * radii] that fit and center them when shown as a plain icon.
 */
const COLLAR_ICON: [number, number] = [0.72, 0.1];
const HEAD_UNIT_ICONS: Partial<Record<IconName, [number, number]>> = {
  dragonbornHelmet: [0.7, 0.28], darkLordHelmet: [0.66, 0.2], mouseEars: [0.8, 0.78], bowMouseEars: [0.8, 0.78],
  flowerCrown: [0.95, 0.59], diamondTiara: [1.25, 1.12], mohawk: [1.3, 1.56], afro: [0.72, 0.73], quiff: [0.9, 0.77],
  tinyBell: COLLAR_ICON, cozyScarf: COLLAR_ICON, goldMedal: COLLAR_ICON, diamondCollar: COLLAR_ICON, rainbowCollar: COLLAR_ICON,
  starlightScarf: COLLAR_ICON, bowTie: COLLAR_ICON, spikedCollar: COLLAR_ICON, pearlNecklace: COLLAR_ICON, goldenBell: COLLAR_ICON,
  cosmicCollar: COLLAR_ICON, houseScarf: COLLAR_ICON, arcReactor: COLLAR_ICON, heroCrest: COLLAR_ICON,
};

const FACE_ICONS = new Set<IconName>([
  'readingGlasses', 'coolShades', 'bubblegumShades', 'spaceGoggles', 'falseLashes', 'roundSpecs', 'blackEye', 'tapeSpecs', 'piratePatch', 'monocle',
  'heartShades', 'sleepMask', 'threeDGlasses', 'starShades', 'aviators', 'masqueradeMask', 'cyberVisor', 'diamondLashes', 'laserVisor', 'wizardSpecs', 'webMask', 'warPaint',
]);
