import { restartedState } from '../../logic/state.ts';
import { C, GOLD, MUTED, VIEW_H, VIEW_W } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

const LOGO = 'victoryLogo';

/** Full-screen win card over everything, sidebar included. Either button closes it for good. */
export function showVictory(game: GameScene) {
  const { ui } = game;
  game.s.victoryShown = true;
  game.save();
  const layer = game.add.container(0, 0).setDepth(100);
  ui.setDomVisible(false);
  const close = () => {
    layer.destroy();
    ui.setDomVisible(true);
  };
  const cx = VIEW_W / 2;
  ui.within(layer, () => {
    ui.rect(cx, VIEW_H / 2, VIEW_W, VIEW_H, C.bg, 0).setInteractive();
    ui.txt(cx, 330, 'VICTORY', 120, GOLD, true).setOrigin(0.5);
    ui.txt(cx, 412, 'Every cat found, every upgrade bought. Cat Capitalist is complete!', 22, '#ffffff').setOrigin(0.5);
    ui.txt(cx, 446, 'Start over for a fresh run, or keep playing this one.', 16, MUTED).setOrigin(0.5);
    // A pulsing gold halo marks the suggested choice without fighting the button's own hover effect.
    const halo = ui.rect(cx - 130, 532, 322, 88, C.gold, 16, 0.5);
    game.tweens.add({ targets: halo, alpha: 0.15, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ui.button(cx - 130, 530, 300, 66, 'Start New Game', C.green, () => {
      game.s = restartedState(game.s);
      game.selectedCat = 0;
      game.buyMode = 3;
      game.resetFlyingCats();
      game.save();
      game.sidebar.drawFavorite();
      close();
      game.show('businesses');
      ui.toast('A new game has started.');
    }, 24);
    ui.button(cx + 160, 530, 200, 50, 'Continue', C.grey, close, 18);
  });
  game.sfx.play('award');
  const addLogo = () => {
    if (!layer.active) return;
    layer.add(game.add.image(cx, 170, LOGO).setDisplaySize(170, 170));
  };
  if (game.textures.exists(LOGO)) return addLogo();
  game.load.svg(LOGO, `${import.meta.env.BASE_URL}favicon.svg`, { width: 340, height: 340 });
  game.load.once('complete', addLogo);
  game.load.start();
}
