import { BUSINESSES } from '../../logic/data/businesses.ts';
import { SUPER_MANAGERS, SUPER_MULT } from '../../logic/data/superManagers.ts';
import { superRewardText } from '../../logic/format.ts';
import type { Cat } from '../../logic/state.ts';
import { drawCat } from '../art/drawCat.ts';
import { C, GOLD, VIEW_H, VIEW_W } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

// Managers are drawn with the same cat renderer, dressed for the job.
export const MANAGER_LOOKS: Cat[] = [
  { breed: 0, coat: 0, head: -1, face: -1, neck: 1 },
  { breed: 1, coat: 2, head: -1, face: -1, neck: 4 },
  { breed: 5, coat: 0, head: 8, face: -1, neck: -1 },
  { breed: 4, coat: 4, head: 6, face: -1, neck: -1 },
  { breed: 3, coat: 5, head: 0, face: -1, neck: -1 },
  { breed: 1, coat: 3, head: 3, face: -1, neck: -1 },
  { breed: 2, coat: 5, head: -1, face: 2, neck: -1 },
  { breed: 4, coat: 6, head: 11, face: -1, neck: -1 },
  { breed: 0, coat: 1, head: -1, face: 5, neck: -1 },
  { breed: 6, coat: 3, head: -1, face: 9, neck: -1 },
];

// Super managers outrank the regular ones, and dress like it.
export const SUPER_LOOKS: Cat[] = [
  { breed: 4, coat: 6, head: 6, face: -1, neck: -1 },
  { breed: 3, coat: 5, head: -1, face: 2, neck: 7 },
  { breed: 1, coat: 1, head: 8, face: -1, neck: -1 },
  { breed: 5, coat: 0, head: 6, face: 5, neck: -1 },
  { breed: 2, coat: 5, head: -1, face: -1, neck: 4 },
  { breed: 4, coat: 4, head: 8, face: -1, neck: 7 },
  { breed: 7, coat: 3, head: 3, face: 2, neck: -1 },
  { breed: 6, coat: 6, head: 11, face: -1, neck: 10 },
  { breed: 5, coat: 1, head: -1, face: 9, neck: -1 },
  { breed: 7, coat: 7, head: 11, face: 5, neck: 10 },
];

const H = 470;

/** Same introduction for a super manager, plus what the hire paid. */
export function showSuperManagerIntro(game: GameScene, i: number) {
  const { ui } = game;
  const hire = SUPER_MANAGERS[i];
  const top = VIEW_H / 2 - H / 2;
  ui.openPanel(hire.name, `${hire.personality} · ${BUSINESSES[i].name} profits x${SUPER_MULT} forever`, H, () => {
    ui.rect(VIEW_W / 2, top + 172, 140, 140, C.dark, 70);
    ui.own(drawCat(game, VIEW_W / 2, top + 176, 54, SUPER_LOOKS[i]));
    ui.txt(VIEW_W / 2, top + 296, `“${hire.intro}”`, 18, GOLD).setOrigin(0.5).setAlign('center').setWordWrapWidth(660);
    ui.txt(VIEW_W / 2, top + 362, `Hiring bonus: ${superRewardText(hire.reward)}`, 18, '#ffffff', true).setOrigin(0.5);
    ui.button(VIEW_W / 2, top + 418, 240, 50, 'Welcome aboard!', C.green, () => ui.closePanel());
  });
  game.sfx.play('hire');
}

/** The new manager introduces themselves, in character. */
export function showManagerIntro(game: GameScene, i: number) {
  const { ui } = game;
  const biz = BUSINESSES[i];
  const top = VIEW_H / 2 - H / 2;
  ui.openPanel(biz.manager, `${biz.personality} · now runs the ${biz.name}`, H, () => {
    ui.rect(VIEW_W / 2, top + 182, 150, 150, C.dark, 75);
    ui.own(drawCat(game, VIEW_W / 2, top + 186, 58, MANAGER_LOOKS[i]));
    ui.txt(VIEW_W / 2, top + 322, `“${biz.intro}”`, 18, GOLD).setOrigin(0.5).setAlign('center').setWordWrapWidth(660);
    ui.button(VIEW_W / 2, top + 418, 240, 50, 'Welcome aboard!', C.green, () => ui.closePanel());
  });
  game.sfx.play('hire');
}
