import type { State } from '../logic/state.ts';
import { CUES, cueSpec, TIERS, type Cue } from './sfxCues.ts';

const MAX_VOICES = 6;
const soundUrl = (file: string) => `${import.meta.env.BASE_URL}sounds/${file.split('/').map(encodeURIComponent).join('/')}`;

/**
 * Plays every sound effect in the game, through one Web Audio graph so overlapping is under control:
 * per-cue cooldowns, one jingle at a time (a higher tier or a new special one takes over, the rest are dropped) and a voice limit.
 * It stays silent until `unlock()` runs on the first interaction, and if a file or Web Audio itself is unavailable.
 */
export class Sfx {
  /** Counts every request, heard or not, so a button can tell its action already made a sound. */
  plays = 0;
  /** Called when a jingle starts, with its length in ms, so the music can make room. */
  onJingle?: (ms: number) => void;
  private ctx?: AudioContext;
  private master?: GainNode;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly lastPlayed = new Map<Cue, number>();
  private readonly lastFile = new Map<Cue, string>();
  private jingle?: { source: AudioBufferSourceNode; gain: GainNode; rank: number };
  private voices = 0;
  private volume = 0;

  /** Applies the player's level. */
  sync(s: State) {
    this.volume = s.sfxVolume;
    if (this.master) this.master.gain.value = this.volume;
  }

  /** Browsers only allow audio after a user gesture; this runs on the first one and loads the catalog. */
  unlock() {
    if (this.ctx || !window.AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    void this.ctx.resume();
    for (const file of new Set(Object.values(CUES).flatMap((cue) => cue.files))) void this.load(file);
  }

  private async load(file: string) {
    try {
      const response = await fetch(soundUrl(file));
      if (!response.ok || !this.ctx) return;
      this.buffers.set(file, await this.ctx.decodeAudioData(await response.arrayBuffer()));
    } catch {
      // Missing file or undecodable format: that cue just stays silent.
    }
  }

  play(cue: Cue) {
    this.plays++;
    const { ctx, master } = this;
    if (!ctx || !master || this.volume <= 0 || document.hidden || this.voices >= MAX_VOICES) return;
    const spec = cueSpec(cue);
    const tier = TIERS[spec.tier];
    const now = performance.now();
    if (now - (this.lastPlayed.get(cue) ?? -Infinity) < (spec.cooldownMs ?? tier.cooldownMs)) return;

    const isJingle = tier.rank >= TIERS.rewarding.rank;
    const playing = this.jingle?.rank;
    if (playing !== undefined) {
      // Special moments are never dropped: a newer one takes over. Everything else waits its turn.
      if (isJingle && (tier.rank < playing || (tier.rank === playing && playing !== TIERS.special.rank))) return;
      if (playing === TIERS.special.rank && tier.rank === TIERS.medium.rank) return; // let the big moment breathe
    }

    // Vary repeated sounds: never the same file twice in a row, and a slight pitch drift on the small ones.
    const options = spec.files.length > 1 ? spec.files.filter((file) => file !== this.lastFile.get(cue)) : spec.files;
    const file = options[Math.floor(Math.random() * options.length)];
    const buffer = this.buffers.get(file);
    if (!buffer) return;
    this.lastPlayed.set(cue, now);
    this.lastFile.set(cue, file);

    if (isJingle && this.jingle) this.fadeOutJingle();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (!isJingle) source.playbackRate.value = 0.97 + Math.random() * 0.06;
    const gain = ctx.createGain();
    gain.gain.value = spec.volume ?? tier.volume;
    source.connect(gain).connect(master);
    this.voices++;
    const voice = { source, gain, rank: tier.rank };
    source.onended = () => {
      this.voices--;
      gain.disconnect();
      if (this.jingle === voice) this.jingle = undefined;
    };
    if (isJingle) {
      this.jingle = voice;
      this.onJingle?.(buffer.duration * 1000);
    }
    source.start();
  }

  private fadeOutJingle() {
    const { jingle, ctx } = this;
    if (!jingle || !ctx) return;
    jingle.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    jingle.source.stop(ctx.currentTime + 0.12);
    this.jingle = undefined;
  }

  destroy() {
    void this.ctx?.close();
    this.ctx = undefined;
    this.buffers.clear();
  }
}
