import Phaser from 'phaser';
import { GameScene } from './GameScene.ts';

/** Caps canvas pixels on very dense screens; beyond this the gain isn't visible but the cost is. */
const MAX_PIXEL_RATIO = 3;
const pixelRatio = () => Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

/** Phaser rasterizes text once, so wait for the web font first (resolves anyway when offline). */
export function waitForFonts() {
  return Promise.all([document.fonts.load('400 20px Fredoka'), document.fonts.load('700 20px Fredoka')]).catch(() => undefined);
}

export function createGame(parent: HTMLElement) {
  const ratio = pixelRatio();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: Math.round(parent.clientWidth * ratio),
    height: Math.round(parent.clientHeight * ratio),
    parent,
    backgroundColor: '#241733',
    dom: { createContainer: true },
    // The canvas holds physical pixels and CSS shrinks it to the window, so HiDPI screens aren't upscaled.
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / ratio },
    // Audio has its own small layer (music.ts, sfx.ts); this skips Phaser's unused second AudioContext.
    audio: { noAudio: true },
    // A low path threshold keeps Graphics curves smooth when the camera zooms in.
    render: { antialias: true, antialiasGL: true, roundPixels: false, pathDetailThreshold: 0.25 },
    scene: GameScene,
  });

  const fit = () => {
    const current = pixelRatio();
    game.scale.resize(Math.round(parent.clientWidth * current), Math.round(parent.clientHeight * current));
    // After resize: at zoom 1 only setZoom updates the canvas CSS size, and it does so for the current size.
    game.scale.setZoom(1 / current);
  };

  window.addEventListener('resize', fit);

  game.events.once(Phaser.Core.Events.DESTROY, () => window.removeEventListener('resize', fit));

  return game;
}
