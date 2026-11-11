import { invoke, isTauri } from '@tauri-apps/api/core';
import { AWARDS } from '../../logic/awards.ts';
import { bestCatBonusPct, TOTAL_CAT_COMBINATIONS, undiscoveredCatCombos } from '../../logic/collection.ts';
import { incomeRate, profitMult } from '../../logic/economy.ts';
import { fmt, fmtCompact } from '../../logic/format.ts';
import { parseSaveData, restartedState, type State } from '../../logic/state.ts';
import { hex } from '../art/color.ts';
import { C, CX, CY, GOLD, MUTED, RED, VIEW_H, VIEW_W } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { clearSave } from '../save.ts';

const STATS: [label: string, value: (s: State) => string][] = [
  ['Profit multiplier', (s) => { const p = profitMult(s); return `x${p < 1000 ? p.toFixed(2) : fmtCompact(p)}`; }],
  ['Best cat bonus', (s) => `+${bestCatBonusPct(s)}`],
  ['Income per second', (s) => fmt(incomeRate(s))],
  ['Lifetime earnings', (s) => fmt(s.lifetime)],
  ['Cats collected', (s) => `${TOTAL_CAT_COMBINATIONS - undiscoveredCatCombos(s).length} / ${TOTAL_CAT_COMBINATIONS}`],
  ['Awards', (s) => `${s.awards.filter(Boolean).length} / ${AWARDS.length}`],
  ['Ascensions', (s) => fmtCompact(s.ascensions)],
  ['Strays caught', (s) => fmtCompact(s.strays)],
];

export function profileView(game: GameScene) {
  const { ui } = game;
  ui.title('Profile', 'Your cat empire at a glance.');
  const top = CY + 48;

  // statistics
  ui.box(CX, top, 1048, 268);
  ui.txt(CX + 24, top + 14, 'Statistics', 22, '#ffffff', true);
  const values = STATS.map(([label], k) => {
    const x = CX + 20 + (k % 4) * 255;
    const y = top + 56 + Math.floor(k / 4) * 102;
    ui.box(x, y, 243, 92, C.dark, 12);
    ui.txt(x + 121, y + 26, label, 14, MUTED).setOrigin(0.5);
    return ui.txt(x + 121, y + 58, '', 23, GOLD, true).setOrigin(0.5);
  });

  // save file
  const lowerTop = top + 280;
  const saveW = 680;
  const saveX = CX + saveW / 2;
  ui.box(CX, lowerTop, saveW, 224);
  ui.txt(CX + 24, lowerTop + 14, 'Save file', 22, '#ffffff', true);
  ui.txt(CX + 24, lowerTop + 48, 'So you never lose your progress!', 15, MUTED);
  const status = ui.txt(saveX, lowerTop + 180, '', 15, MUTED).setOrigin(0.5);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.save,application/json';
  fileInput.setAttribute('aria-label', 'Load cat-capitalist.save');
  Object.assign(fileInput.style, { width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
  ui.own(game.add.dom(-20, -20, fileInput).setAlpha(0));

  ui.button(saveX - 216, lowerTop + 118, 200, 46, 'Export save', C.green, async () => {
    const contents = JSON.stringify(game.s, null, 2);
    if (!isTauri()) {
      const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cat-capitalist.save';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.setText('Save exported as cat-capitalist.save.').setColor(hex(C.green));
      return;
    }
    try {
      if (await invoke<boolean>('export_save', { contents })) status.setText('Backup saved.').setColor(hex(C.green));
    } catch {
      status.setText('Could not save the file. Try another folder.').setColor(RED);
    }
  });
  ui.button(saveX, lowerTop + 118, 200, 46, 'Load a .save file', C.cardLight, () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const imported = parseSaveData(await file.text());
      if (!imported) {
        status.setText('Invalid save file. Your current game is unchanged.').setColor(RED);
        return;
      }
      game.s = imported;
      game.buyMode = imported.buyMode;
      game.selectedCat = Math.min(game.selectedCat, imported.cats.length - 1);
      game.save();
      game.sidebar.drawFavorite();
      game.show('businesses');
      ui.toast('Save imported successfully.');
    } catch {
      status.setText('Could not read this file. Your current game is unchanged.').setColor(RED);
    }
  });

  ui.button(saveX + 216, lowerTop + 118, 200, 46, 'Start a new game', 0xff6b6b, () => {
    ui.openPanel('Start over?', 'Your game and bought songs will be lost. Export first to keep a copy.', 300, () => {
      ui.button(VIEW_W / 2 - 100, VIEW_H / 2 + 58, 190, 46, 'Start over', 0xff6b6b, () => {
        game.s = restartedState(game.s);
        clearSave();
        game.selectedCat = 0;
        game.buyMode = 3;
        game.resetFlyingCats();
        game.save();
        game.sidebar.drawFavorite();
        ui.closePanel();
        game.show('businesses');
        ui.toast('A new game has started.');
      }, 16);
      ui.button(VIEW_W / 2 + 110, VIEW_H / 2 + 58, 160, 46, 'Keep playing', C.grey, () => ui.closePanel(), 16);
    });
  });

  // cheats
  const cheatsX = CX + saveW + 12;
  const cheatsW = 1048 - saveW - 12;
  ui.box(cheatsX, lowerTop, cheatsW, 224);
  ui.iconText(cheatsX + cheatsW / 2, lowerTop + 30, 'gamepad', 13, 'Cheats', 22, '#ffffff', true);
  ui.txt(cheatsX + cheatsW / 2, lowerTop + 78, 'Enter a code to claim a one-time reward.', 15, MUTED)
    .setOrigin(0.5).setAlign('center').setWordWrapWidth(cheatsW - 48);
  ui.button(cheatsX + cheatsW / 2, lowerTop + 150, 200, 46, 'Open cheats', C.orange, () => {
    game.sfx.play('tab');
    game.show('cheats');
  });

  return () => values.forEach((value, k) => value.setText(STATS[k][1](game.s)));
}
