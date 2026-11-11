import Phaser from 'phaser';
import type { Cat } from '../../logic/state.ts';
import { FONT, textRes } from '../constants.ts';
import { buildCat, type FaceState } from './drawCat.ts';
import { drawIcon, type IconName } from './icons.ts';

const { Between, FloatBetween } = Phaser.Math;
const side = () => (Math.random() < 0.5 ? -1 : 1);
const CENTER = { x: 0, y: 0 };
const RESET: Partial<FaceState> = { eyes: 'open', mouth: 'neutral', blush: false, pupil: 1 };

type Gesture = (done: () => void) => void;

/**
 * A cat portrait that feels alive: soft breathing, random blinks and, after random pauses,
 * one random gesture or expression (tilts, watching the mouse cursor, purring, yawning,
 * meowing, dozing off, blep, surprise). Everything stops when the returned container is destroyed.
 */
export function idleCat(scene: Phaser.Scene, x: number, y: number, r: number, cat: Cat, effects: string[] = []) {
  // rotate around the neck, not the middle of the face
  const neck = r * 0.9;
  const { container: body, face } = buildCat(scene, 0, -neck, r, cat);
  const rig = scene.add.container(x, y + neck, [body]);
  const alive = () => rig.scene !== undefined;
  const later = (ms: number, fn: () => void) => scene.time.delayedCall(ms, () => alive() && fn());

  // ---- eyes: ease the pupils toward whatever the cat is looking at ----
  let lookAt = () => CENTER;
  const cursor = () => {
    // In world coordinates: the pointer's own x/y are canvas pixels, which differ under camera zoom.
    const p = scene.input.activePointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
    const dx = p.x - x;
    const dy = p.y - (y - 0.08 * r);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / (r * 1.5)); // pointer right on the face = look almost straight
    return { x: (dx / d) * k, y: (dy / d) * k };
  };
  const onUpdate = () => {
    const t = lookAt();
    const gx = face.state.gazeX + (t.x - face.state.gazeX) * 0.2;
    const gy = face.state.gazeY + (t.y - face.state.gazeY) * 0.2;
    if (Math.abs(gx - face.state.gazeX) + Math.abs(gy - face.state.gazeY) > 0.005) face.set({ gazeX: gx, gazeY: gy });
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  rig.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    scene.tweens.killTweensOf([rig, body]);
  });

  // ---- expressions ----
  let blinkId = 0; // a newer expression cancels a pending "open eyes again"
  const express = (changes: Partial<FaceState>) => {
    blinkId++;
    face.set(changes);
  };
  const blink = (closedMs = 110) => {
    if (face.state.eyes !== 'open') return;
    const id = ++blinkId;
    face.set({ eyes: 'closed' });
    later(closedMs, () => id === blinkId && face.set({ eyes: 'open' }));
  };
  const drift = (t: Phaser.GameObjects.Text | Phaser.GameObjects.Container) =>
    scene.tweens.add({ targets: t, y: t.y - r * 0.8, x: t.x + FloatBetween(-10, 10), alpha: 0, duration: 1500, ease: 'Sine.Out', onComplete: () => t.destroy() });
  const float = (name: IconName) => drift(drawIcon(scene, x + r * 0.75, y - r * 0.9, r * 0.22, name).setDepth(5));
  const say = (text: string) => drift(
    scene.add.text(x + r * 0.75, y - r * 0.9, text, { fontFamily: FONT, fontSize: `${Math.round(r * 0.42)}px`, color: '#ffffff', fontStyle: 'bold', resolution: textRes(scene) })
      .setOrigin(0.5).setDepth(5).setStroke('#1c1229', 3),
  );

  scene.tweens.add({ targets: rig, scaleY: 1.015, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  const scheduleBlink = () =>
    later(Between(1800, 6000), () => {
      blink();
      if (Math.random() < 0.25) later(220, () => blink()); // double blink
      scheduleBlink();
    });

  // head moves toward `to`, pauses, and eases back
  const move = (to: { angle?: number; x?: number }, hold: number, done: () => void) =>
    scene.tweens.add({
      targets: rig, ...to, x: x + (to.x ?? 0), duration: Between(320, 560), hold, yoyo: true, ease: 'Sine.InOut', onComplete: done,
    });

  const watchCursor: Gesture = (done) => {
    express({ pupil: 1.3 });
    lookAt = cursor;
    if (Math.random() < 0.5) later(Between(600, 1200), () => move({ angle: FloatBetween(4, 8) * side() }, Between(600, 1400), () => later(Between(400, 1200), done)));
    else later(Between(2500, 5000), done);
  };

  const gestures: Gesture[] = [
    (done) => move({ angle: FloatBetween(5, 11) * side() }, Between(700, 2200), done), // head tilt
    (done) => { // glance aside: eyes lead, head follows a little
      const s = side();
      const where = { x: s, y: FloatBetween(-0.4, 0.4) };
      lookAt = () => where;
      move({ angle: FloatBetween(1, 3) * s, x: Between(2, 4) * s }, Between(600, 1500), done);
    },
    (done) => { // curious: round pupils, one side then the other
      const s = side();
      express({ pupil: 1.8 });
      move({ angle: FloatBetween(5, 9) * s }, Between(400, 900), () => move({ angle: -FloatBetween(4, 8) * s }, Between(400, 900), done));
    },
    (done) => { // slow "I trust you" blink
      blink(Between(400, 700));
      later(900, done);
    },
    (done) => later(Between(1500, 3500), done), // just sit
    watchCursor,
    watchCursor, // twice as likely
    (done) => { // a quick curious look, then back to center
      const where = { x: side(), y: FloatBetween(-0.25, 0.25) };
      lookAt = () => where;
      later(Between(500, 1000), () => {
        lookAt = () => CENTER;
        later(250, done);
      });
    },
    (done) => { // a quick head shake, like a whisker flick
      scene.tweens.add({
        targets: rig, angle: 3 * side(), duration: 95, yoyo: true, repeat: 2,
        ease: 'Sine.InOut', onComplete: done,
      });
    },
    (done) => { // soft stretch and release
      scene.tweens.add({
        targets: body, scaleX: 1.035, scaleY: 0.99, duration: 420, yoyo: true,
        ease: 'Sine.InOut', onComplete: done,
      });
    },
    (done) => { // happy purr
      express({ eyes: 'happy', mouth: 'smile', blush: true });
      float('heart');
      later(800, () => float('heart'));
      move({ angle: FloatBetween(3, 6) * side() }, Between(1200, 2000), done);
    },
    (done) => { // yawn
      express({ eyes: 'closed', mouth: 'yawn' });
      scene.tweens.add({
        targets: rig, scaleX: 1.05, angle: FloatBetween(-3, 3), duration: 500, hold: 700, yoyo: true, ease: 'Sine.InOut',
        onComplete: () => {
          express(RESET);
          blink();
          later(500, done);
        },
      });
    },
    (done) => { // meow
      express({ mouth: 'open', eyes: Math.random() < 0.5 ? 'happy' : 'open' });
      say('mew!');
      later(Between(450, 700), done);
    },
    (done) => { // doze off, then wake up with a start
      express({ eyes: 'half' });
      later(900, () => {
        express({ eyes: 'closed' });
        float('sleep');
        later(1300, () => float('sleep'));
        later(Between(2500, 4000), () => {
          express({ eyes: 'wide' });
          later(300, done);
        });
      });
    },
    (done) => { // blep: forgot the tongue out
      express({ mouth: 'blep' });
      later(Between(2000, 4000), done);
    },
    (done) => { // surprise
      express({ eyes: 'wide', pupil: 2.2 });
      float('exclaim');
      scene.tweens.add({ targets: body, y: body.y - r * 0.12, duration: 110, yoyo: true, ease: 'Quad.Out' });
      later(Between(700, 1100), done);
    },
  ];

  const scheduleGesture = () =>
    later(Between(1500, 5000), () =>
      gestures[Between(0, gestures.length - 1)](() => {
        express(RESET);
        lookAt = () => CENTER;
        scheduleGesture();
      }),
    );

  const effectIcons = effects.map((effect): IconName => effect === 'sparkle' ? 'sparkle' : effect === 'fire' ? 'flame' : 'rainbow');
  const scheduleEffect = () => later(Between(12000, 22000), () => {
    if (Math.random() < 0.55) float(effectIcons[Between(0, effectIcons.length - 1)]);
    scheduleEffect();
  });

  scheduleBlink();
  scheduleGesture();
  if (effectIcons.length) scheduleEffect();
  return rig;
}
