import { bestCatBonusPct, catBonusPct, catName, catRarity, type CatUnlockReward } from '../../logic/collection.ts';
import { RARITIES } from '../../logic/data/cats.ts';
import type { Cat } from '../../logic/state.ts';
import { hex } from '../art/color.ts';
import { drawCat } from '../art/drawCat.ts';
import { C, GOLD, MUTED, VIEW_W } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

/** Indexed by rarity: the rarer the cat, the bigger the moment. */
const REVEAL_CUES = ['catCommon', 'catRare', 'catEpic', 'catLegendary'] as const;

/** Full-screen reveal shared by every path that gives the player one new cat. */
export function revealCat(game: GameScene, cat: Cat, reward?: CatUnlockReward) {
  const { ui } = game;
  const rarity = RARITIES[catRarity(cat)];
  game.selectedCat = game.s.cats.indexOf(cat);
  game.sidebar.drawFavorite();
  if (catRarity(cat) >= 2) game.cameras.main.flash(400, 255, 220, 140);
  game.sfx.play(REVEAL_CUES[catRarity(cat)]);

  ui.openPanel('A new cat joins the family!', 'Say hello to your new friend.', 500, () => {
    const rays = ui.own(game.add.graphics({ x: VIEW_W / 2, y: 350 }));
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      rays.fillStyle(rarity.color, 0.25).fillTriangle(0, 0, Math.cos(a - 0.12) * 125, Math.sin(a - 0.12) * 125, Math.cos(a + 0.12) * 125, Math.sin(a + 0.12) * 125);
    }
    game.tweens.add({ targets: rays, angle: 360, duration: 9000, repeat: -1 });
    const drawn = ui.own(drawCat(game, VIEW_W / 2, 350, 70, cat)).setScale(0);
    game.tweens.add({ targets: drawn, scale: 1, duration: 500, ease: 'Back.Out' });
    ui.txt(VIEW_W / 2, 470, `${rarity.name.toUpperCase()} · ${catName(cat)}`, 26, hex(rarity.color), true).setOrigin(0.5);
    ui.txt(VIEW_W / 2, 502, `This cat: +${catBonusPct(cat)} · Best cat bonus applied: +${bestCatBonusPct(game.s)}`, 17, GOLD).setOrigin(0.5);
    if (reward) ui.txt(VIEW_W / 2, 530, `First discovery reward: ${reward.label}`, 15, MUTED).setOrigin(0.5);
    ui.button(VIEW_W / 2, 572, 200, 46, 'Hello!', C.green, () => ui.closePanel(), 17, 'catLove');
  });
  // After the panel opens, so it waits in line and gets its own moment once the reveal closes.
  if (reward?.diamonds) ui.toast(`+${reward.diamonds} Diamond for discovering a ${catName(cat)}!`, 'diamond');
}
