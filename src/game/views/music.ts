import { fmt } from '../../logic/format.ts';
import { buyTrack, changeVolume, currentTrack, MUSIC_TRACKS, ownsTrack, selectTrack, stepTrack, toggleMusic, trackCost, trackPrice, type Track } from '../../logic/music.ts';
import { C, CX, CY, GOLD, MUTED, PAGER_GAP, PAGER_X, PAGER_Y, RED, ROW_W } from '../constants.ts';
import type { IconName } from '../art/icons.ts';
import type { GameScene } from '../GameScene.ts';
import type { Button } from '../ui/Ui.ts';

/** Two columns of five fill the page; the pager only appears past ten tracks. */
const ROWS_PER_COLUMN = 5;
const PAGE_SIZE = ROWS_PER_COLUMN * 2;
const MUSIC_ROW_GAP = 82;
/** One list for the whole collection: free tunes first, then by price. */
const ORDERED = [...MUSIC_TRACKS].sort((a, b) => trackPrice(a) - trackPrice(b));

export function musicView(game: GameScene) {
  const { ui, music } = game;
  music.probeTracks();
  const collected = ui.title('Music Store', '');
  const applied = () => {
    game.save();
    music.sync(game.s);
    game.sfx.sync(game.s);
  };

  // now playing
  const top = CY + 50;
  ui.box(CX, top, 1048, 70);
  ui.icon(CX + 26, top + 35, 15, 'headphones');
  const nowPlaying = ui.txt(CX + 52, top + 16, '', 19, '#ffffff', true);
  const status = ui.txt(CX + 52, top + 42, '', 13, MUTED);
  const step = (dir: 1 | -1) => {
    if (!stepTrack(game.s, dir, music.missing)) return;
    applied();
    ui.toast(`Now playing: ${currentTrack(game.s)!.title}`, 'music');
  };
  const shuffle = ui.button(CX + 744, top + 35, 56, 42, '', C.cardLight, () => {
    game.s.musicShuffle = !game.s.musicShuffle;
    applied();
    game.sfx.play('toggle');
  }, 17, 'shuffle');
  ui.button(CX + 806, top + 35, 56, 42, '', C.cardLight, () => step(-1), 17, 'previous');
  const toggle = ui.button(CX + 900, top + 35, 112, 42, '', C.orange, () => {
    toggleMusic(game.s);
    applied();
    game.sfx.play('toggle');
  }, 16);
  ui.button(CX + 994, top + 35, 56, 42, '', C.cardLight, () => step(1), 17, 'next');

  // volume levels; changing either one plays a tick, so the new level can be heard
  const volumeControl = (x: number, icon: IconName, which: 'musicVolume' | 'sfxVolume') => {
    ui.icon(x, top + 35, 11, icon);
    const change = (steps: number) => {
      changeVolume(game.s, which, steps);
      applied();
      game.sfx.play('tick');
    };
    ui.button(x + 30, top + 35, 28, 30, '-', C.cardLight, () => change(-1), 18);
    const label = ui.txt(x + 68, top + 35, '', 14, '#ffffff', true).setOrigin(0.5);
    ui.button(x + 106, top + 35, 28, 30, '+', C.cardLight, () => change(1), 16);
    return () => label.setText(`${Math.round(game.s[which] * 100)}%`);
  };
  const volumeLabels = [volumeControl(CX + 410, 'note', 'musicVolume'), volumeControl(CX + 590, 'bell', 'sfxVolume')];

  const pageCount = Math.max(1, Math.ceil(ORDERED.length / PAGE_SIZE));
  let page = 0;
  let rows: { track: Track; button: Button; state: Phaser.GameObjects.Text; icon: Phaser.GameObjects.Container }[] = [];
  const pageLayer = ui.own(game.add.container(0, 0));
  const rowClick = (track: Track, x: number, y: number) => {
    const s = game.s;
    if (music.missing.has(track.fileName)) return;
    if (!ownsTrack(s, track)) {
      if (!buyTrack(s, track.fileName)) return ui.floatText(x, y, 'Not enough money!', RED);
      selectTrack(s, track.fileName);
      applied();
      drawPage(); // the owned count in the heading
      return ui.toast(`${track.title} is yours!`, 'music', 'note', 'musicBuy');
    }
    if (currentTrack(s) === track) {
      toggleMusic(s);
      game.sfx.play('toggle');
    } else {
      selectTrack(s, track.fileName);
      ui.toast(`Now playing: ${track.title}`, 'music');
    }
    applied();
  };
  const drawPage = () => {
    pageLayer.removeAll(true);
    ui.within(pageLayer, () => {
      const tracks = ORDERED.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
      // ponytail: one heading per column, named after its first track; fine while free tunes fill exactly one column
      [tracks[0], tracks[ROWS_PER_COLUMN]].forEach((first, col) => {
        if (!first) return;
        const heading = trackPrice(first) ? `Owned Tunes · ${MUSIC_TRACKS.filter((t) => trackPrice(t) && ownsTrack(game.s, t)).length}/${MUSIC_TRACKS.filter(trackPrice).length}` : 'Free Tunes';
        ui.txt(CX + col * (ROW_W + 16) + 4, top + 98, heading, 16, '#ffffff', true).setOrigin(0, 0.5);
      });
      rows = tracks.map((track, n) => {
        const x = CX + (n < ROWS_PER_COLUMN ? 0 : ROW_W + 16);
        const y = top + 116 + (n % ROWS_PER_COLUMN) * MUSIC_ROW_GAP;
        const { sub, icon, buttonX, buttonY } = ui.itemRow(x, y, 'note', track.title, '');
        const button = ui.button(buttonX, buttonY, 140, 36, '', C.green, () => rowClick(track, buttonX, y), 15);
        return { track, button, state: sub, icon };
      });
    });
  };
  const showPager = pageCount > 1
    ? ui.pager(PAGER_X, PAGER_Y, PAGER_GAP, (dir) => { page = Math.min(pageCount - 1, Math.max(0, page + dir)); drawPage(); })
    : undefined;

  drawPage();
  if (!MUSIC_TRACKS.length) ui.txt(CX + 524, CY + 320, 'No tracks listed yet. Add some to src/logic/data/music.json.', 18, MUTED).setOrigin(0.5);

  return () => {
    const s = game.s;
    const current = currentTrack(s);
    const missing = current !== undefined && music.missing.has(current.fileName);
    volumeLabels.forEach((refresh) => refresh());
    collected.setText(`${MUSIC_TRACKS.filter((item) => ownsTrack(s, item)).length}/${MUSIC_TRACKS.length} tunes collected · yours forever, even after ascending`);
    nowPlaying.setText(current?.title ?? 'No music available');
    status.setText(missing ? `File missing: music/${current.fileName}` : !current ? '' : !s.musicOn ? 'Paused' : !music.playing ? 'Starts on your next click' : s.musicShuffle ? 'Playing · shuffle on' : 'Playing');
    status.setColor(missing ? RED : MUTED);
    shuffle.setColor(s.musicShuffle ? C.orange : C.cardLight);
    toggle.setLabel(s.musicOn ? 'Pause' : 'Play', s.musicOn ? 'pause' : 'play');
    toggle.setDisabled(!current || missing);
    toggle.setColor(!current || missing ? C.unavailable : C.orange);
    showPager?.(page, pageCount);
    rows.forEach(({ track, button, state }) => {
      const owned = ownsTrack(s, track);
      const unavailable = music.missing.has(track.fileName);
      const active = track === current;
      const price = trackCost(s, track);
      const playing = active && s.musicOn;
      state.setText(unavailable ? `File missing: music/${track.fileName}` : playing ? 'Now playing' : active ? 'Selected · paused' : !trackPrice(track) ? 'Free tune' : owned ? 'Owned' : 'Not owned yet');
      state.setColor(unavailable ? RED : active ? GOLD : MUTED);
      if (unavailable) button.setLabel('Unavailable');
      else if (!owned) button.setLabel(`Buy ${fmt(price)}`, 'coin');
      else button.setLabel(playing ? 'Pause' : 'Play', playing ? 'pause' : 'play');
      button.setDisabled(unavailable);
      // Green plays what you own; gold sells what you don't.
      button.setColor(unavailable ? C.unavailable : !owned ? (s.money >= price ? C.gold : C.grey) : active ? C.purchased : C.green);
    });
  };
}
