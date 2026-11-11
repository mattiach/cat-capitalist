import Phaser from 'phaser';
import { shade } from './color.ts';
import { pen, type Pen, type Point } from './pen.ts';

/** Target of an upgrade that boosts every business. */
export const ALL_BUSINESSES = -1;

const WHITE = 0xffffff;
const MIRROR = [-1, 1];

/** One drawing per business, in the same order as BUSINESSES. */
export const DRAW_BUSINESS: ((p: Pen, g: Phaser.GameObjects.Graphics) => void)[] = [
  // Yarn Ball Stand: wool ball with knitting needles and a loose thread
  (p) => {
    const wool = 0x4285ff;
    const strand = shade(wool, 0.68);
    for (const side of MIRROR) {
      p.line(side * -0.82, -0.86, side * 0.62, 0.56, 0xb9c2d0, 1.5);
      p.circle(side * -0.82, -0.86, 0.11, 0xffcf5a, shade(0xffcf5a, 0.6));
    }
    p.arc(0.62, 0.76, 0.22, 180, 360, strand, 1.2);
    p.circle(0, 0.06, 0.72, wool, shade(wool, 0.5));
    for (const radius of [0.72, 0.94, 1.16]) p.arc(-0.96, 0.06, radius, -34, 34, strand, 0.9);
    for (const radius of [0.55, 0.75]) p.arc(0.12, -0.94, radius, 55, 125, strand, 0.9);
    p.ellipse(-0.26, -0.26, 0.42, 0.24, WHITE, undefined, 0.35);
  },
  // Milk Bar: glass bottle with a paw on the label
  (p) => {
    const glass = 0xcfeaf7;
    const edge = 0x4f7f9f;
    p.poly([[-0.24, -0.82], [0.24, -0.82], [0.24, -0.5], [0.46, -0.2], [0.46, 0.84], [-0.46, 0.84], [-0.46, -0.2], [-0.24, -0.5]], glass, edge);
    p.box(0, 0.36, 0.76, 0.84, 0.08, WHITE);
    p.ellipse(0, -0.06, 0.76, 0.14, 0xeef8ff);
    p.box(0, -0.86, 0.6, 0.22, 0.06, 0xff6b6b, shade(0xff6b6b, 0.55));
    p.circle(0, 0.44, 0.17, 0xff9db8);
    for (const [x, y] of [[-0.19, 0.22], [0, 0.15], [0.19, 0.22]]) p.circle(x, y, 0.075, 0xff9db8);
    p.line(-0.34, -0.1, -0.34, 0.66, 0xb9dcef, 1.1);
  },
  // Cardboard Box Factory: open box with a cat peeking out
  (p) => {
    const card = 0xd9a066;
    const edge = shade(card, 0.5);
    const fur = 0xf4a261;
    p.poly([[-0.82, -0.14], [-0.56, -0.44], [0.56, -0.44], [0.82, -0.14]], shade(card, 0.45), edge);
    for (const side of MIRROR) {
      p.poly([[side * 0.5, -0.3], [side * 0.14, -0.34], [side * 0.46, -0.84]], fur, shade(fur, 0.58));
      p.poly([[side * 0.42, -0.36], [side * 0.24, -0.38], [side * 0.42, -0.62]], 0xffb3c1);
    }
    p.ellipse(0, -0.2, 1.04, 0.5, fur, shade(fur, 0.58));
    for (const side of MIRROR) p.circle(side * 0.2, -0.25, 0.06, 0x2b1e2f);
    p.box(0, 0.32, 1.64, 0.96, 0.05, card, edge);
    p.box(0, 0.32, 0.3, 0.96, 0, 0xeec08a);
    for (const side of MIRROR) {
      p.poly([[side * 0.82, -0.14], [side * 1, 0.12], [side * 0.5, 0.12], [side * 0.28, -0.14]], shade(card, 0.85), edge);
    }
    p.line(-0.62, 0.62, -0.32, 0.62, edge, 1);
  },
  // Catnip Farm: leafy plant in a terracotta pot
  (p) => {
    const pot = 0xd9734e;
    const leaf = 0x5bbf5f;
    p.leaf(0, 0.26, -150, 0.86, 0.22, shade(leaf, 0.82));
    p.leaf(0, 0.26, -30, 0.86, 0.22, shade(leaf, 0.82));
    p.leaf(0, 0.26, -118, 1, 0.24, leaf);
    p.leaf(0, 0.26, -62, 1, 0.24, leaf);
    p.leaf(0, 0.26, -90, 1.16, 0.26, 0x7ad872);
    p.poly([[-0.48, 0.3], [0.48, 0.3], [0.34, 0.92], [-0.34, 0.92]], pot, shade(pot, 0.55));
    p.box(0, 0.28, 1.12, 0.24, 0.05, pot, shade(pot, 0.55));
    p.line(-0.42, 0.26, 0.42, 0.26, 0xf0a184, 1);
  },
  // Cat Café: steaming cup with cat ears on a saucer
  (p) => {
    const cup = 0xf7ecd9;
    const edge = 0x9a7a5c;
    for (const x of [-0.14, 0.16]) {
      p.arc(x - 0.08, -0.72, 0.09, -90, 90, WHITE, 0.9, 0.8);
      p.arc(x + 0.08, -0.56, 0.09, 90, 270, WHITE, 0.9, 0.8);
    }
    p.ellipse(0, 0.74, 1.62, 0.3, 0xe4d5be, edge);
    p.arc(0.66, 0.22, 0.24, -90, 90, edge, 3);
    p.arc(0.66, 0.22, 0.24, -90, 90, cup, 1.6);
    for (const side of MIRROR) p.poly([[side * 0.68, -0.08], [side * 0.26, -0.14], [side * 0.6, -0.56]], cup, edge);
    p.poly([[-0.68, -0.08], [0.68, -0.08], [0.48, 0.68], [-0.48, 0.68]], cup, edge);
    p.ellipse(0, -0.08, 1.36, 0.38, cup, edge);
    p.ellipse(0, -0.08, 1.08, 0.26, 0x6f4a2f);
    p.ellipse(0, -0.08, 0.34, 0.1, 0xd9b48f);
  },
  // Tuna Cannery: open-topped tin with a fish on the label
  (p) => {
    const tin = 0x3f8fd8;
    const edge = shade(tin, 0.5);
    p.ellipse(0, 0.62, 1.56, 0.42, shade(tin, 0.8), edge);
    p.box(0, 0.2, 1.56, 0.84, 0, tin);
    for (const side of MIRROR) p.line(side * 0.78, -0.2, side * 0.78, 0.62, edge, 1);
    p.ellipse(-0.08, 0.34, 0.8, 0.42, WHITE);
    p.poly([[0.26, 0.34], [0.62, 0.12], [0.62, 0.56]], WHITE);
    p.circle(-0.3, 0.29, 0.05, 0x20304a);
    p.ellipse(0, -0.2, 1.56, 0.5, 0xc8d1dc, 0x76818f);
    p.ellipse(0, -0.2, 1.22, 0.32, 0xa3adb9);
    p.arc(0.26, -0.22, 0.13, 0, 360, 0x6b7584, 1);
    p.line(0.14, -0.22, -0.1, -0.2, 0x6b7584, 1);
  },
  // Scratching Post Co.: rope-wrapped post with a perch and a dangling toy
  (p) => {
    const carpet = 0x9a78c8;
    const rope = 0xdcbb82;
    const edge = shade(rope, 0.55);
    p.line(0.62, -0.5, 0.62, 0.04, 0xd6d0e0, 0.8);
    p.circle(0.62, 0.14, 0.14, 0xff78a8, shade(0xff78a8, 0.55));
    p.box(0, 0.76, 1.56, 0.26, 0.1, carpet, shade(carpet, 0.55));
    p.box(0, 0.08, 0.6, 1.3, 0.03, rope, edge);
    for (let y = -0.42; y <= 0.66; y += 0.2) p.line(-0.28, y, 0.28, y - 0.13, edge, 0.8);
    p.box(0, -0.62, 1.42, 0.26, 0.1, carpet, shade(carpet, 0.55));
  },
  // Luxury Cat Hotel: lit windows, an awning and cat ears on the roof
  (p) => {
    const wall = 0x8a5fb8;
    const edge = shade(wall, 0.5);
    const gold = 0xffcf5a;
    for (const side of MIRROR) p.poly([[side * 0.58, -0.62], [side * 0.2, -0.62], [side * 0.54, -0.98]], gold, shade(gold, 0.55));
    p.box(0, 0.18, 1.36, 1.42, 0.05, wall, edge);
    p.poly([[-0.78, -0.48], [0.78, -0.48], [0.5, -0.72], [-0.5, -0.72]], gold, shade(gold, 0.55));
    for (const y of [-0.24, 0.1]) {
      for (const x of [-0.4, 0, 0.4]) {
        p.box(x, y, 0.24, 0.24, 0.03, x === 0 && y > 0 ? 0xc9b3e6 : 0xffe28a, edge);
      }
    }
    p.box(0, 0.66, 0.36, 0.46, 0.03, 0x5a2f6b, edge);
    p.box(0, 0.4, 0.64, 0.12, 0.04, 0xff6b6b, shade(0xff6b6b, 0.55));
    p.circle(0.09, 0.68, 0.03, gold);
  },
  // Laser Pointer Inc.: pen-shaped pointer with its beam and the red dot
  (p, g) => {
    g.setAngle(-38);
    const body = 0x4a5060;
    p.circle(0.74, 0, 0.3, 0xff3b4e, undefined, 0.25);
    p.line(0.16, 0, 0.72, 0, 0xff3b4e, 1.8);
    p.circle(0.74, 0, 0.16, 0xff3b4e);
    p.circle(0.74, 0, 0.06, WHITE);
    p.box(-0.36, 0, 1.08, 0.36, 0.09, body, shade(body, 0.5));
    p.box(0.2, 0, 0.18, 0.28, 0.03, 0xc8d1dc, 0x76818f);
    p.line(-0.76, -0.1, 0.02, -0.1, 0x7c8498, 0.9);
    p.circle(-0.36, 0, 0.09, 0xff6b6b, shade(0xff6b6b, 0.5));
  },
  // Cat Space Program: rocket with a cat-eared porthole and a flame
  (p, g) => {
    g.setAngle(32);
    const hull = 0xf2f4fa;
    const edge = 0x7d8498;
    const red = 0xff5a5f;
    p.poly([[-0.22, 0.62], [0.22, 0.62], [0, 1.08]], 0xff9a3c);
    p.poly([[-0.11, 0.62], [0.11, 0.62], [0, 0.88]], 0xffe28a);
    for (const side of MIRROR) p.poly([[side * 0.32, 0.12], [side * 0.68, 0.66], [side * 0.22, 0.54]], red, shade(red, 0.55));
    p.ellipse(0, -0.06, 0.78, 1.52, hull, edge);
    const cap: Point[] = [];
    for (let angle = 212; angle <= 328; angle += 12) {
      const a = Phaser.Math.DegToRad(angle);
      cap.push([Math.cos(a) * 0.39, -0.06 + Math.sin(a) * 0.76]);
    }
    p.poly(cap, red, shade(red, 0.55));
    p.box(0, 0.64, 0.4, 0.1, 0.03, 0x8a92a6, edge);
    for (const side of MIRROR) p.poly([[side * 0.2, -0.22], [side * 0.05, -0.28], [side * 0.2, -0.42]], 0x355b8c);
    p.circle(0, -0.08, 0.22, 0x8fd3ff, 0x355b8c);
    p.ellipse(-0.06, -0.14, 0.14, 0.08, WHITE, undefined, 0.8);
  },
];

/** Gold star with a paw, for upgrades that boost every business. */
function drawAllBusinesses(p: Pen) {
  const gold = 0xffcf5a;
  const star: Point[] = [];
  for (let k = 0; k < 10; k++) {
    const a = Phaser.Math.DegToRad(-90 + k * 36);
    const reach = k % 2 ? 0.46 : 0.98;
    star.push([Math.cos(a) * reach, Math.sin(a) * reach]);
  }
  p.poly(star, gold, shade(gold, 0.55));
  const paw = shade(gold, 0.55);
  p.circle(0, 0.14, 0.2, paw);
  for (const [x, y] of [[-0.21, -0.08], [0, -0.17], [0.21, -0.08]]) p.circle(x, y, 0.08, paw);
}

/**
 * Custom business icon of radius r centered at (x, y), drawn with the same Graphics approach as drawCat.
 * `business` is an index into BUSINESSES, or ALL_BUSINESSES.
 */
export function drawBusinessIcon(scene: Phaser.Scene, x: number, y: number, r: number, business: number) {
  const g = scene.add.graphics();
  const p = pen(g, r);
  if (business === ALL_BUSINESSES) drawAllBusinesses(p);
  else DRAW_BUSINESS[business](p, g);
  return scene.add.container(x, y, [g]);
}
