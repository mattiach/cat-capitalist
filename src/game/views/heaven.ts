import { fmt, fmtCompact } from '../../logic/format.ts';
import { angelMult, angelsToClaim, ascend, ascendFish, canAscend, lifetimeForAngels, MAX_ANGELS, minAscendClaim } from '../../logic/prestige.ts';

const multText = (angels: number) => { const m = angelMult(angels); return m < 1000 ? m.toFixed(m < 10 ? 2 : 0) : fmtCompact(m); };
import { drawAngelCat } from '../art/drawCat.ts';
import { C, CX, CY, GOLD, MUTED, VIEW_W, RED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

const rewardText = (claim: number) => `+${claim} Angel Cats · +${ascendFish(claim)} Golden Fish`;

/** Returns the reward line, so the view can keep it in step with what ascending would pay right now. */
function confirmAscend(game: GameScene) {
  const { ui } = game;
  let reward!: Phaser.GameObjects.Text;
  ui.openPanel('Ascend to Cat Heaven?', 'Your run resets, but your collection stays.', 300, () => {
    reward = ui.txt(VIEW_W / 2, 350, rewardText(angelsToClaim(game.s)), 26, GOLD, true).setOrigin(0.5);
    if (Object.values(game.s.investments).some((item) => item.readyAt !== undefined)) ui.txt(VIEW_W / 2, 392, 'Investments not collected yet will be lost, capital included.', 15, RED).setOrigin(0.5);
    ui.button(VIEW_W / 2 - 120, 430, 200, 50, 'Ascend', C.orange, () => {
      game.s = ascend(game.s);
      game.sfx.play('ascend');
      game.save();
      ui.closePanel();
      game.cameras.main.flash(600, 255, 255, 255);
      game.show('businesses');
      game.sidebar.drawFavorite();
      ui.toast('Welcome to your next life!', 'rare', 'halo');
    }, 17, 'halo');
    ui.button(VIEW_W / 2 + 120, 430, 200, 50, 'Not yet', C.grey, () => ui.closePanel());
  });
  return reward;
}

export function heavenView(game: GameScene) {
  const { ui } = game;
  const mx = CX + 524;
  const left = CX + 214;
  const right = CX + 834;
  ui.title('Cat Heaven', 'Trade this run for permanent Angel Cats.');
  ui.box(CX + 174, CY + 50, 700, 550);
  ui.own(drawAngelCat(game, mx, CY + 150, 44));
  const labels = ['Angel Cats', 'Lifetime earnings', 'Ascend now for'];
  const rows = [CY + 250, CY + 294, CY + 338].map((y, i) => {
    ui.txt(left, y, labels[i], 16, MUTED, true).setOrigin(0, 0.5);
    return ui.txt(right, y, '', 18, i === 2 ? GOLD : '#ffffff', true).setOrigin(1, 0.5);
  });
  ui.txt(mx, CY + 414, 'Ascending resets money, businesses, managers and upgrades.\nYou keep cats, accessories, awards, Golden Fish and Angel Cats.', 15, MUTED)
    .setOrigin(0.5).setAlign('center');
  const status = ui.txt(mx, CY + 458, '', 15, GOLD, true).setOrigin(0.5);
  let confirmReward: Phaser.GameObjects.Text | undefined;
  const ascendButton = ui.button(mx, CY + 510, 260, 56, 'Ascend', C.orange, () => { confirmReward = confirmAscend(game); }, 22, 'halo');

  return () => {
    const claim = angelsToClaim(game.s);
    if (confirmReward?.active) confirmReward.setText(rewardText(claim));
    const compact = (value: number) => fmt(value).slice(1);
    const ready = canAscend(game.s);
    const minimum = minAscendClaim(game.s);
    status.setText(ready
      ? `Ready! Your Angel Cat bonus grows from x${multText(game.s.angels)} to x${multText(game.s.angels + claim)} profit.`
      : `Ascending needs at least +${compact(minimum)} Angel Cats: earn ${fmt(lifetimeForAngels(game.s.angels - game.s.giftedAngels + minimum) - game.s.lifetime)} more.`);
    ascendButton.setDisabled(!ready);
    ascendButton.setColor(ready ? C.orange : C.grey);
    rows[0].setText(`${compact(game.s.angels)}/${MAX_ANGELS}  ·  x${multText(game.s.angels)} profit`);
    rows[1].setText(fmt(game.s.lifetime));
    rows[2].setText(`+${compact(claim)} Angel Cats  ·  +${compact(ascendFish(claim))} Fish`);
  };
}
