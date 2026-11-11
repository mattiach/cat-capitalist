import { AWARD_GROUPS, AWARDS } from '../../logic/awards.ts';
import { C, CX, GOLD, MUTED, PAGER_X, PAGER_Y, ROW_TOP } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

const PAGE_SIZE = 16;
/** Display order: grouped by theme, while saves keep using each award's position in AWARDS. */
const ORDER = AWARD_GROUPS.flatMap((group) => AWARDS.flatMap((a, k) => (a.group === group ? [k] : [])));
const PAGE_COUNT = Math.ceil(ORDER.length / PAGE_SIZE);
/** Survives the rebuild that follows a new award. */
let page = 0;

export function awardsView(game: GameScene) {
  const { s, ui } = game;
  const pageOf = (order: number) => Math.floor(order / PAGE_SIZE);
  const firstNew = ORDER.findIndex((k) => game.isNew(k));
  if (firstNew >= 0) page = pageOf(firstNew);
  ui.title('Awards', `${s.awards.filter(Boolean).length}/${AWARDS.length} unlocked · Each award pays Golden Fish`);

  const layer = ui.own(game.add.container(0, 0));
  const draw = () => {
    layer.removeAll(true);
    ui.within(layer, () => {
      ORDER.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).forEach((k, n) => {
        const a = AWARDS[k];
        const x = CX + (n % 4) * 264;
        const y = ROW_TOP + Math.floor(n / 4) * 124;
        const done = s.awards[k];
        const card = ui.box(x, y, 256, 112);
        if (done) card.setStrokeStyle(3, a.group === 'Diamonds' ? C.diamond : C.gold);
        ui.rect(x + 36, y + 56, 52, 52, C.dark, 26);
        if (done) ui.icon(x + 36, y + 56, 19, a.icon);
        else ui.icon(x + 36, y + 56, 14, 'lock').setAlpha(0.6);
        ui.txt(x + 70, y + 12, a.name, 16, done ? GOLD : '#ffffff', true);
        ui.txt(x + 70, y + 36, a.desc, 13, MUTED).setWordWrapWidth(176);
        ui.icon(x + 79, y + 93, 8, 'fish');
        ui.txt(x + 92, y + 84, `${a.fish}${done ? '  claimed' : ''}`, 13, GOLD, true);
        if (game.isNew(k)) ui.newTag(x + 226, y + 92);
      });
    });
    const groups = AWARD_GROUPS.filter((group) => ORDER.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).some((k) => AWARDS[k].group === group)).join(' · ');
    const newOn = (test: (itemPage: number) => boolean) => ORDER.some((k, order) => test(pageOf(order)) && game.isNew(k));
    showPager(page, PAGE_COUNT, newOn((p) => p < page), newOn((p) => p > page), ` · ${groups}`);
  };
  const showPager = ui.pager(PAGER_X, PAGER_Y, 294, (dir) => {
    page = Math.min(PAGE_COUNT - 1, Math.max(0, page + dir));
    draw();
  });
  draw();
}
