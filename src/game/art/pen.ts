import Phaser from 'phaser';
import { shade } from './color.ts';

export type Point = [x: number, y: number];

const CORNER_CUT = 0.2;

/** Rounds a closed shape's corners by cutting each one repeatedly, so nothing ends in a hard point. */
function softenCorners(points: Point[], passes: number) {
  let shape = points;
  for (let pass = 0; pass < passes; pass++) {
    shape = shape.flatMap(([x, y], k): Point[] => {
      const [nx, ny] = shape[(k + 1) % shape.length];
      return [
        [x + (nx - x) * CORNER_CUT, y + (ny - y) * CORNER_CUT],
        [x + (nx - x) * (1 - CORNER_CUT), y + (ny - y) * (1 - CORNER_CUT)],
      ];
    });
  }
  return shape;
}

/**
 * Drawing helpers in unit coordinates: (0, 0) is the center and 1 is the icon's radius.
 * Everything is drawn soft on purpose: corners are rounded, outlines are translucent with a faint
 * halo, and fills bleed a little past their edge, so shapes look painted rather than cut out.
 */
export function pen(g: Phaser.GameObjects.Graphics, r: number, lineScale = 1) {
  // Graphics are redrawn every frame, and at small sizes the extra soft layers can't be seen anyway.
  const fine = r >= 24;
  // `lineScale` thins the strokes of a drawing made at a large radius, so it matches smaller ones beside it.
  const width = (weight = 1) => Math.max(0.8, r * 0.06 * weight * lineScale);
  const feather = Math.max(0.7, r * 0.045 * lineScale);
  /** Runs `trace` once per layer: a wide faint halo, then the line itself. */
  const softStroke = (color: number, weight: number, alpha: number, trace: () => void) => {
    if (fine) {
      g.lineStyle(width(weight) * 2.1, color, alpha * 0.16);
      trace();
    }
    g.lineStyle(width(weight), color, alpha * 0.72);
    trace();
  };
  /** A fill's edge: its own color bleeding outward, or a soft outline when the shape has one. */
  const finish = (color: number, edge: number | undefined, alpha: number, trace: () => void) => {
    if (edge !== undefined) softStroke(edge, 1, 1, trace);
    else if (fine && alpha >= 1) {
      g.lineStyle(feather, color, 0.4);
      trace();
    }
  };
  const poly = (points: Point[], color: number, edge?: number, alpha = 1) => {
    g.fillStyle(color, alpha).beginPath();
    softenCorners(points, fine ? 2 : 1).forEach(([x, y], k) => (k ? g.lineTo(x * r, y * r) : g.moveTo(x * r, y * r)));
    g.closePath().fillPath();
    finish(color, edge, alpha, () => g.strokePath());
  };
  return {
    poly,
    circle(x: number, y: number, radius: number, color: number, edge?: number, alpha = 1) {
      g.fillStyle(color, alpha).fillCircle(x * r, y * r, radius * r);
      finish(color, edge, alpha, () => g.strokeCircle(x * r, y * r, radius * r));
    },
    ellipse(x: number, y: number, w: number, h: number, color: number, edge?: number, alpha = 1) {
      g.fillStyle(color, alpha).fillEllipse(x * r, y * r, w * r, h * r);
      finish(color, edge, alpha, () => g.strokeEllipse(x * r, y * r, w * r, h * r));
    },
    /** Rounded box centered on (x, y). Corners always get some rounding, even when asked for square ones. */
    box(x: number, y: number, w: number, h: number, round: number, color: number, edge?: number, alpha = 1) {
      const radius = Math.max(round, Math.min(w, h) * 0.16) * r;
      g.fillStyle(color, alpha).fillRoundedRect((x - w / 2) * r, (y - h / 2) * r, w * r, h * r, radius);
      finish(color, edge, alpha, () => g.strokeRoundedRect((x - w / 2) * r, (y - h / 2) * r, w * r, h * r, radius));
    },
    line(x1: number, y1: number, x2: number, y2: number, color: number, weight = 1, alpha = 1) {
      softStroke(color, weight, alpha, () => g.lineBetween(x1 * r, y1 * r, x2 * r, y2 * r));
      if (fine && alpha >= 1) {
        // Round caps, so a stroke ends like a brush mark instead of a saw cut.
        g.fillStyle(color, 0.72);
        for (const [x, y] of [[x1, y1], [x2, y2]]) g.fillCircle(x * r, y * r, width(weight) / 2);
      }
    },
    /** Angles in degrees, clockwise from the +x axis. */
    arc(x: number, y: number, radius: number, from: number, to: number, color: number, weight = 1, alpha = 1) {
      softStroke(color, weight, alpha, () => g.beginPath().arc(x * r, y * r, radius * r, Phaser.Math.DegToRad(from), Phaser.Math.DegToRad(to)).strokePath());
    },
    /** Outline of an ellipse with no fill: rings, halos. */
    ring(x: number, y: number, w: number, h: number, color: number, weight = 1, alpha = 1) {
      softStroke(color, weight, alpha, () => g.strokeEllipse(x * r, y * r, w * r, h * r));
    },
    /** Soft light or shadow that fades out toward its edge. `alpha` is what the center ends up with. */
    glow(x: number, y: number, w: number, h: number, color: number, alpha: number, steps = 6) {
      // Small drawings can't show fine gradients, and a screenful of them is redrawn every frame.
      const small = r < 40;
      const layers = small ? Math.min(steps, 3) : steps;
      for (let k = 1; k <= layers; k++) {
        const size = k / layers;
        g.fillStyle(color, alpha / layers).fillEllipse(x * r, y * r, w * size * r, h * size * r, small ? 14 : 32);
      }
    },
    /** Pointed leaf growing from (x, y) at the given angle. Also used for feathers. */
    leaf(x: number, y: number, angle: number, length: number, leafWidth: number, color: number) {
      const a = Phaser.Math.DegToRad(angle);
      const along = (t: number, side: number): Point => {
        const reach = t * length;
        const spread = side * leafWidth * Math.sin(Math.PI * t);
        return [x + Math.cos(a) * reach - Math.sin(a) * spread, y + Math.sin(a) * reach + Math.cos(a) * spread];
      };
      const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
      poly([...steps.map((t) => along(t, 1)), ...steps.slice(1, -1).reverse().map((t) => along(t, -1))], color, shade(color, 0.72));
      const [tipX, tipY] = along(0.8, 0);
      g.lineStyle(width(0.6), shade(color, 0.72), 0.4).lineBetween(x * r, y * r, tipX * r, tipY * r);
    },
    /** Pointed star. */
    star(x: number, y: number, outer: number, inner: number, color: number, edge?: number, points = 5, turn = -90) {
      const corners: Point[] = [];
      for (let k = 0; k < points * 2; k++) {
        const a = Phaser.Math.DegToRad(turn + (k * 180) / points);
        const reach = k % 2 ? inner : outer;
        corners.push([x + Math.cos(a) * reach, y + Math.sin(a) * reach]);
      }
      poly(corners, color, edge);
    },
    /** Heart with its center at (x, y). */
    heart(x: number, y: number, s: number, color: number, edge?: number) {
      const shape: Point[] = [];
      for (let k = 0; k < 28; k++) {
        const t = (k / 28) * Math.PI * 2;
        const hx = 16 * Math.sin(t) ** 3;
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        shape.push([x + (hx / 16) * s, y - (hy / 16) * s]);
      }
      poly(shape, color, edge);
    },
  };
}

export type Pen = ReturnType<typeof pen>;
