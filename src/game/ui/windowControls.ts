import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { IconName } from '../art/icons.ts';
import { C, VIEW_H, VIEW_W } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

/** Desktop only: F11 or the header button enter fullscreen; while fullscreen, that button and Esc ask before leaving the game. */
export function createWindowControls(game: GameScene) {
  if (!isTauri()) return;
  const { ui } = game;
  const win = getCurrentWindow();
  const setFullscreen = (value: boolean) => void win.setFullscreen(value);

  const confirmExit = () => {
    if (ui.hasPanel || game.touring) return;
    ui.openPanel('Leave Cat Capitalist?', 'Your progress is saved and your managers keep working.', 260, () => {
      const y = VIEW_H / 2 + 45;
      ui.button(VIEW_W / 2 - 240, y, 210, 50, 'Keep playing', C.green, () => ui.closePanel());
      ui.button(VIEW_W / 2, y, 210, 50, 'Windowed', C.grey, () => { ui.closePanel(); setFullscreen(false); });
      ui.button(VIEW_W / 2 + 240, y, 210, 50, 'Exit game', C.orange, () => { game.save(); void win.close(); });
    });
  };

  game.buyBox.setX(0);
  const headerButton = (icon: IconName, onClick: () => void) => {
    const box = game.add.container(0, 0).setVisible(false);
    ui.within(box, () => {
      ui.button(1244, 36, 40, 40, '', C.grey, onClick, 19, icon);
    });
    return box;
  };
  const closeButton = headerButton('close', confirmExit);
  const fullscreenButton = headerButton('fullscreen', () => setFullscreen(true));

  let fullscreen = false;
  const syncFullscreen = async () => {
    fullscreen = await win.isFullscreen();
    closeButton.setVisible(fullscreen);
    fullscreenButton.setVisible(!fullscreen);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'F11') {
      event.preventDefault();
      setFullscreen(!fullscreen);
    } else if (event.key === 'Escape' && fullscreen) {
      confirmExit();
    }
  };
  void syncFullscreen();
  window.addEventListener('resize', syncFullscreen);
  window.addEventListener('keydown', onKey);
  game.events.once('destroy', () => {
    window.removeEventListener('resize', syncFullscreen);
    window.removeEventListener('keydown', onKey);
  });
}
