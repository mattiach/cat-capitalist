import { currentTrack, MUSIC_TRACKS } from '../logic/music.ts';
import type { State } from '../logic/state.ts';

const trackUrl = (fileName: string) => `${import.meta.env.BASE_URL}music/${encodeURIComponent(fileName)}`;
const SWITCH_FADE_MS = 150;
const FADE_IN_MS = 300;
const DUCK_FADE_MS = 120;
/** How far the music dips while a jingle plays, so the two don't fight. */
const DUCK_LEVEL = 0.5;

/**
 * Background music on one long-lived audio element, independent of tabs and views. With a single element
 * two tracks can never overlap. `sync()` is safe to call at any time: it never restarts a loaded track.
 */
export class MusicPlayer {
  /** Files that failed to load; shown as unavailable and never retried until the page reloads. */
  readonly missing = new Set<string>();
  /** Called when a track finishes, which only happens with shuffle on. */
  onEnded?: () => void;
  private readonly audio = new Audio();
  private fileName?: string;
  private probed = false;
  private level = 0;
  private ducked = false;
  private duckTimer?: number;
  private fadeTimer?: number;
  private switching = false;

  constructor() {
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.addEventListener('ended', () => this.onEnded?.());
    this.audio.addEventListener('error', () => {
      if (this.fileName) this.missing.add(this.fileName);
    });
  }

  get playing() {
    return !this.audio.paused;
  }

  private get target() {
    return Math.min(1, this.level * (this.ducked ? DUCK_LEVEL : 1));
  }

  private fade(to: number, ms: number, then?: () => void) {
    window.clearInterval(this.fadeTimer);
    const from = this.audio.volume;
    const started = performance.now();
    this.fadeTimer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - started) / ms);
      this.audio.volume = from + (to - from) * t;
      if (t < 1) return;
      window.clearInterval(this.fadeTimer);
      then?.();
    }, 20);
  }

  private start() {
    // Rejected until the player's first interaction, or if the file is broken; `error` covers the latter.
    this.audio.play().catch(() => undefined);
  }

  sync(s: State) {
    this.audio.loop = !s.musicShuffle;
    const track = currentTrack(s);
    if (!track || this.missing.has(track.fileName)) return this.audio.pause();
    this.level = s.musicVolume * (track.gain ?? 1);
    if (track.fileName !== this.fileName) {
      const first = this.fileName === undefined || this.audio.paused;
      this.fileName = track.fileName;
      this.switching = true;
      const load = () => {
        this.switching = false;
        this.audio.src = trackUrl(this.fileName!);
        this.audio.volume = 0;
        if (s.musicOn) this.start();
        this.fade(this.target, FADE_IN_MS);
      };
      if (first) load();
      else this.fade(0, SWITCH_FADE_MS, load); // fade the old track out before loading the new one
      return;
    }
    if (this.switching) return;
    if (!s.musicOn) return this.audio.pause();
    if (this.audio.paused) this.start();
    if (Math.abs(this.audio.volume - this.target) > 0.001) this.fade(this.target, DUCK_FADE_MS);
  }

  /** Dips the music for a moment while a jingle plays. */
  duck(ms: number) {
    this.ducked = true;
    window.clearTimeout(this.duckTimer);
    if (!this.switching) this.fade(this.target, DUCK_FADE_MS);
    this.duckTimer = window.setTimeout(() => {
      this.ducked = false;
      if (!this.switching) this.fade(this.target, FADE_IN_MS);
    }, ms);
  }

  /** Checks every listed file once, so a missing track can't be bought or selected. */
  probeTracks() {
    if (this.probed) return;
    this.probed = true;
    for (const { fileName } of MUSIC_TRACKS) {
      const probe = new Audio();
      probe.preload = 'metadata';
      probe.addEventListener('error', () => this.missing.add(fileName), { once: true });
      // Only the headers are needed: drop the element as soon as they arrive so it holds no connection.
      probe.addEventListener('loadedmetadata', () => probe.removeAttribute('src'), { once: true });
      probe.src = trackUrl(fileName);
    }
  }

  destroy() {
    window.clearInterval(this.fadeTimer);
    window.clearTimeout(this.duckTimer);
    this.audio.pause();
    this.audio.removeAttribute('src');
  }
}
