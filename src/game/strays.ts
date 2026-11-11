import Phaser from 'phaser';
import { catchStray } from '../logic/strays.ts';
import { randomUndiscoveredCat } from '../logic/collection.ts';
import { newState } from '../logic/state.ts';
import type { Cat } from '../logic/state.ts';
import { drawWalkingCat } from './art/drawCat.ts';
import { CY, VIEW_H, VIEW_W } from './constants.ts';
import type { GameScene } from './GameScene.ts';

/** Any coat and breed, rolled with the usual rarity odds: strays are just passing through, so nothing is owned. */
const randomStrayLook = (): Cat => randomUndiscoveredCat({ ...newState(), cats: [] })!;

/** After `delay` ms a stray cat walks across the screen; clicking it gives a random reward. Repeats forever. */
export function scheduleStray(game: GameScene, delay: number) {
  const timer = game.time.delayedCall(delay, () => {
    game.clearStraySpawnTimer(timer);
    const quietUntil = game.s.yarnBonusAt + 60000;
    if (game.s.yarnBonusAt && Date.now() < quietUntil) {
      scheduleStray(game, quietUntil - Date.now());
      return;
    }
    const stray = drawWalkingCat(game, VIEW_W + 60, Phaser.Math.Between(CY + 60, VIEW_H - 50), randomStrayLook())
      .setDepth(8).setInteractive({ useHandCursor: true });
    game.registerFlyingCat(stray);
    const leave = () => {
      game.tweens.killTweensOf(stray);
      game.unregisterFlyingCat(stray);
      if (stray.active) stray.destroy();
      scheduleStray(game, Phaser.Math.Between(45000, 110000));
    };
    game.tweens.add({ targets: stray, x: -60, duration: 16000, onComplete: leave });
    stray.once('pointerdown', () => {
      game.ui.floatIcon(stray.x, stray.y - 46, 16, 'heart');
      const before = { diamonds: game.s.diamonds, fish: game.s.fish };
      const message = catchStray(game.s);
      if (game.s.diamonds > before.diamonds) game.ui.toast(message, 'diamond');
      else game.ui.toast(`Stray cat: ${message}`, game.s.fish > before.fish ? 'currency' : 'cat', game.s.fish > before.fish ? 'fish' : 'catFace', game.s.fish > before.fish ? 'fish' : 'stray');
      game.save();
      leave();
    });
  });
  game.setStraySpawnTimer(timer);
}
