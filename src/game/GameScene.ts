import Phaser from 'phaser';
import { checkAwards } from '../logic/awards.ts';
import type { IconName } from '../logic/data/iconNames.ts';
import { hasManager, managerCost, superManagersOpen, tick, YARN_BONUS } from '../logic/economy.ts';
import { fmt } from '../logic/format.ts';
import { canVisitHeaven } from '../logic/prestige.ts';
import { canVisitCatShop } from '../logic/catShop.ts';
import { investorsOpen } from '../logic/investors.ts';
import { stepTrack } from '../logic/music.ts';
import { BUSINESSES } from '../logic/data/businesses.ts';
import { accessoryTipDue, autoHireFirstManager, managerTipDue, managerTipMessage, managerTipTarget } from '../logic/tips.ts';
import type { State } from '../logic/state.ts';
import { isVictory } from '../logic/victory.ts';
import { claimNewUnlocks, sectionsWithNew, syncUnlocks } from '../logic/unlocks.ts';
import { drawWalkingCat } from './art/drawCat.ts';
import { C, CX, GOLD, textRes, VIEW_H, VIEW_W } from './constants.ts';
import { MusicPlayer } from './music.ts';
import { readSave, writeSave } from './save.ts';
import { Sfx } from './sfx.ts';
import { scheduleStray } from './strays.ts';
import { createHeader } from './ui/header.ts';
import { showAccessoryTip } from './ui/accessoryTip.ts';
import { showVictory } from './ui/victory.ts';
import { showManagerIntro } from './ui/managerIntro.ts';
import { createSidebar, type Sidebar } from './ui/sidebar.ts';
import { Ui } from './ui/Ui.ts';
import { createWindowControls } from './ui/windowControls.ts';
import { TABS, type Tab } from './views/index.ts';

/** Owns the game state, the game loop and which tab is on screen. Views and UI read and change it. */
export class GameScene extends Phaser.Scene {
  s!: State;
  ui!: Ui;
  sidebar!: Sidebar;
  music!: MusicPlayer;
  sfx!: Sfx;
  tab: Tab = 'businesses';
  buyMode = 3;
  selectedCat = 0;
  private refreshHeader!: () => void;
  private view?: Phaser.GameObjects.Container;
  private viewUpdate?: () => void;
  private tourLayer?: Phaser.GameObjects.Container;
  get touring() { return !!this.tourLayer; }
  private flyingCats = new Set<Phaser.GameObjects.Container>();
  private yarnBonusTimer?: Phaser.Time.TimerEvent;
  private straySpawnTimer?: Phaser.Time.TimerEvent;
  private freshUnlocks = new Set<string>();
  private lastBoost = 0;
  private tipTarget = -1;
  private tipSeconds = 0;
  private removeAccessoryTip?: () => void;
  buyBox!: Phaser.GameObjects.Container;

  constructor() {
    super('CatCapitalist');
  }

  create() {
    const camera = this.cameras.main;
    let sharpenTimer: Phaser.Time.TimerEvent | undefined;
    const resizeCamera = () => {
      const { width, height } = this.scale.gameSize;
      camera.setZoom(Math.min(width / VIEW_W, height / VIEW_H));
      camera.centerOn(VIEW_W / 2, VIEW_H / 2);
      // Re-rasterize text once the window settles, not on every step of a drag.
      sharpenTimer?.remove();
      sharpenTimer = this.time.delayedCall(150, () => this.sharpenText(this.children.list));
    };
    camera.setBackgroundColor(C.bg);
    resizeCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeCamera);
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeCamera);
    });
    this.s = readSave();
    this.music = new MusicPlayer();
    this.music.onEnded = () => {
      if (!stepTrack(this.s, 1, this.music.missing)) return;
      this.save();
      this.music.sync(this.s);
    };
    this.sfx = new Sfx();
    this.sfx.sync(this.s);
    this.sfx.onJingle = (ms) => this.music.duck(ms);
    this.lastBoost = this.s.boost;
    this.buyMode = this.s.buyMode;
    this.ui = new Ui(this, this.sfx);
    const offline = this.catchUp();

    this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, C.bg);
    for (let i = 0; i < 40; i++) {
      this.ui.icon(CX + Math.random() * (VIEW_W - CX), Math.random() * VIEW_H, 18, 'paw').setAlpha(0.04).setAngle(Math.random() * 360);
    }
    this.sidebar = createSidebar(this);
    this.refreshHeader = createHeader(this);
    createWindowControls(this);
    this.show('businesses');

    if (offline > 0 && this.s.homeTourComplete) {
      this.ui.openPanel('Welcome back!', 'Your managers kept working while you were napping.', 300, () => {
        this.ui.txt(VIEW_W / 2, 350, `Your cats earned ${fmt(offline)}`, 30, GOLD, true).setOrigin(0.5);
        this.ui.button(VIEW_W / 2, 430, 220, 50, 'Purrfect!', C.green, () => this.ui.closePanel());
      });
    }

    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.save() });
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.awardTick() });
    scheduleStray(this, Phaser.Math.Between(20000, 40000));
    this.save();
    this.scheduleYarnBonus();
    if (!this.s.homeTourComplete) this.startTour('home');

    // Phaser pauses in hidden tabs: save on hide, pay out the missed time on return.
    const onUnload = () => this.save();
    const onPageHide = () => this.save();
    const onVisibility = () => {
      if (document.hidden) this.save();
      else this.catchUp();
    };
    // Browsers only allow audio after an interaction, so the first one starts everything.
    const startAudio = () => {
      this.sfx.unlock();
      this.music.sync(this.s);
    };
    window.addEventListener('pointerdown', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.music.destroy();
      this.sfx.destroy();
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  update(_: number, deltaMs: number) {
    tick(this.s, deltaMs / 1000);
    // Zoomies can start from a stray, a cheat or a cat reward; this catches them all in one place.
    if (this.s.boost > 0 && this.lastBoost <= 0) this.sfx.play('zoomies');
    this.lastBoost = this.s.boost;
    this.refreshHeader();
    this.sidebar.refresh();
    this.viewUpdate?.();
  }

  save() {
    this.s.savedAt = Date.now();
    writeSave(this.s);
  }

  show(tab: Tab) {
    if (tab === 'heaven' && !this.canVisitHeaven()) return;
    if (tab === 'catShop' && !canVisitCatShop(this.s)) return;
    if (tab === 'superManagers' && !superManagersOpen(this.s)) return;
    if (tab === 'investors' && !investorsOpen(this.s)) return;
    if ((tab === 'boutique' || tab === 'awards') && !this.hasManager()) return;
    if (tab === 'cattery') this.dismissAccessoryTip();
    if (tab !== this.tab) this.freshUnlocks.clear();
    this.tab = tab;
    this.refreshUnlocks();
    this.music.sync(this.s); // never restarts a loaded track, and picks up imported or new saves
    this.sfx.sync(this.s);
    this.view?.destroy();
    this.view = this.add.container(0, 0);
    const update = this.ui.within(this.view, () => TABS.find((t) => t.id === tab)!.view(this));
    this.viewUpdate = typeof update === 'function' ? update : undefined;
    if (tab === 'heaven' && !this.s.heavenTourComplete) this.startTour('heaven');
  }

  /** Matches text textures to the camera zoom, including text nested in containers. */
  private sharpenText(objects: Phaser.GameObjects.GameObject[]) {
    const res = textRes(this);
    for (const object of objects) {
      if (object instanceof Phaser.GameObjects.Text && object.style.resolution !== res) object.setResolution(res);
      else if (object instanceof Phaser.GameObjects.Container) this.sharpenText(object.list);
    }
  }

  canVisitHeaven() {
    return canVisitHeaven(this.s);
  }

  hasManager() {
    return hasManager(this.s);
  }

  /** True while an item of the open tab should wear its NEW tag. */
  isNew(id: number | string) {
    return this.freshUnlocks.has(`${this.tab}:${id}`);
  }

  /** Drops the NEW tag once the player interacts with the item. */
  clearNew(id: number | string) {
    this.freshUnlocks.delete(`${this.tab}:${id}`);
  }

  /**
   * Latches new unlocks. Those in the open tab count as seen right away, so the sidebar star clears
   * and stays cleared after a reload; their NEW tags live in memory until the player leaves the tab.
   */
  private refreshUnlocks() {
    const before = sectionsWithNew(this.s);
    syncUnlocks(this.s);
    const claimed = claimNewUnlocks(this.s, this.tab);
    // A soft cue when another tab gets its star. Awards are left out: their toast already has a jingle.
    if ([...sectionsWithNew(this.s)].some((section) => !before.has(section) && section !== 'awards')) this.sfx.play('unlock');
    claimed.forEach((key) => this.freshUnlocks.add(key));
    if (claimed.length) this.save();
  }

  registerFlyingCat(cat: Phaser.GameObjects.Container) {
    this.flyingCats.add(cat);
  }

  unregisterFlyingCat(cat: Phaser.GameObjects.Container) {
    this.flyingCats.delete(cat);
  }

  setStraySpawnTimer(timer: Phaser.Time.TimerEvent) {
    this.straySpawnTimer = timer;
  }

  clearStraySpawnTimer(timer: Phaser.Time.TimerEvent) {
    if (this.straySpawnTimer === timer) this.straySpawnTimer = undefined;
  }

  /** Remove scene-level flying rewards when starting over, then schedule the new run's first stray. */
  resetFlyingCats() {
    this.yarnBonusTimer?.remove(false);
    this.straySpawnTimer?.remove(false);
    this.yarnBonusTimer = undefined;
    this.straySpawnTimer = undefined;
    this.flyingCats.forEach((cat) => {
      this.tweens.killTweensOf(cat);
      cat.destroy();
    });
    this.flyingCats.clear();
    scheduleStray(this, Phaser.Math.Between(20000, 40000));
  }

  startTour(which: 'home' | 'heaven') {
    const isHome = which === 'home';
    const steps: [icon: IconName, title: string, body: string][] = isHome
      ? [
          ['catFace', 'Welcome to Cat Capitalist!', 'A game about making money so we can spend every last cent on our beloved cats and collect them all. Fiscal responsibility has left the building.'],
          ['yarn', 'Your first business', 'Click the Yarn Ball Stand to earn money. You can buy more levels of every business to make it pay more.'],
          ['tie', 'Let the cats work', 'Hire a manager to automate a business, so it keeps earning while you focus on your empire.'],
        ]
      : [
          ['halo', 'Welcome to Cat Heaven', 'Angel Cats give a permanent profit bonus, and each ascension adds more.'],
          ['star', 'When to reset?', 'Ascending resets your money, businesses, managers and upgrades. Your collection and permanent progress stay. Ascend when the Angel Cats are worth more than the run you leave behind.'],
        ];
    let step = 0;
    const finish = () => {
      if (isHome) this.s.homeTourComplete = true;
      else this.s.heavenTourComplete = true;
      this.save();
      this.tourLayer?.destroy();
      this.tourLayer = undefined;
    };
    const draw = () => {
      this.tourLayer?.destroy();
      this.tourLayer = this.add.container(0, 0).setDepth(20);
      const focus = isHome
        ? step === 1 ? { x: 208, y: 100, w: 532, h: 128 } : step === 2 ? { x: 10, y: 90, w: 180, h: 34 } : undefined
        : step === 0 ? { x: 890, y: 14, w: 198, h: 44 } : { x: 600, y: 588, w: 280, h: 60 };
      this.ui.within(this.tourLayer, () => {
        if (focus) {
          this.ui.rect(VIEW_W / 2, focus.y / 2, VIEW_W, focus.y, 0x08050d, 0, 0.76);
          this.ui.rect(VIEW_W / 2, (focus.y + focus.h + VIEW_H) / 2, VIEW_W, VIEW_H - focus.y - focus.h, 0x08050d, 0, 0.76);
          this.ui.rect(focus.x / 2, focus.y + focus.h / 2, focus.x, focus.h, 0x08050d, 0, 0.76);
          this.ui.rect((focus.x + focus.w + VIEW_W) / 2, focus.y + focus.h / 2, VIEW_W - focus.x - focus.w, focus.h, 0x08050d, 0, 0.76);
          this.ui.rect(focus.x + focus.w / 2, focus.y + focus.h / 2, focus.w + 8, focus.h + 8, C.gold, 12, 0)
            .setStrokeStyle(3, C.gold, 1);
        } else {
          this.ui.rect(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, 0x08050d, 0, 0.76);
        }
        const w = focus ? 480 : 760;
        const h = 244;
        const x = focus ? (focus.x < 200 ? 450 : 990) : VIEW_W / 2;
        const y = focus ? (step === 2 && isHome ? 214 : step === 1 && isHome ? 164 : 350) : VIEW_H / 2;
        this.ui.rect(x, y + 5, w, h, 0x000000, 20, 0.35);
        this.ui.rect(x, y, w, h, C.card, 20).setStrokeStyle(2, C.orange, 1);
        this.ui.iconText(x, y - 78, steps[step][0], 16, steps[step][1], 25, '#ffad55', true);
        this.ui.txt(x, y - 20, steps[step][2], 17, '#ffffff').setOrigin(0.5)
          .setWordWrapWidth(w - 48).setAlign('center');
        const nextButton = this.ui.button(x + 105, y + 78, 180, 44, '', C.green, () => {
          if (++step === steps.length) finish(); else draw();
        });
        if (step === steps.length - 1) nextButton.setLabel('Let’s go!');
        else nextButton.setLabel('Next', 'arrowRight', true);
        this.ui.button(x - 105, y + 78, 160, 44, 'Skip tour', C.grey, finish);
        this.ui.button(x + w / 2 - 22, y - h / 2 + 20, 34, 34, '', C.grey, finish, 17, 'close');
      });
    };
    draw();
  }

  scheduleYarnBonus() {
    if (!this.s.yarnBonusAt || this.s.yarnBonusClaimed || this.s.yarnBonusSpawned) return;
    this.yarnBonusTimer = this.time.delayedCall(Math.max(0, this.s.yarnBonusAt - Date.now()), () => {
      this.yarnBonusTimer = undefined;
      if (this.s.yarnBonusClaimed || this.s.yarnBonusSpawned) return;
      this.s.yarnBonusSpawned = true;
      this.save();
      const cat = drawWalkingCat(this, VIEW_W + 60, Phaser.Math.Between(170, VIEW_H - 50), { breed: 0, coat: 0, head: -1, face: -1, neck: -1 })
        .setDepth(8).setInteractive({ useHandCursor: true });
      this.registerFlyingCat(cat);
      const leave = () => {
        this.tweens.killTweensOf(cat);
        this.unregisterFlyingCat(cat);
        if (cat.active) cat.destroy();
      };
      this.tweens.add({ targets: cat, x: -60, duration: 16000, onComplete: leave });
      cat.once('pointerdown', () => {
        this.s.money += YARN_BONUS;
        this.s.lifetime += YARN_BONUS;
        this.s.yarnBonusClaimed = true;
        this.save();
        this.ui.toast(`Bonus cat: +${fmt(YARN_BONUS)}!`, 'currency', 'catFace');
        leave();
      });
    });
  }

  /** Rebuild the current view on the next frame (safe to call from its own buttons). */
  rebuild() {
    this.time.delayedCall(0, () => this.show(this.tab));
  }

  /** Pays out the time since the last save (offline or hidden tab). */
  private catchUp() {
    return tick(this.s, Math.max(0, (Date.now() - this.s.savedAt) / 1000));
  }

  /** Remembered only once dismissed, so a reload before then shows the tip again. */
  private dismissAccessoryTip() {
    if (!this.removeAccessoryTip) return;
    this.removeAccessoryTip();
    this.removeAccessoryTip = undefined;
    this.s.accessoryTipShown = true;
    this.save();
  }

  /** Early-game guidance, checked once a second. */
  private earlyTips() {
    if (this.touring) return;
    const { s } = this;
    if (autoHireFirstManager(s)) {
      const { manager, name } = BUSINESSES[0];
      this.save();
      this.ui.toast(`${manager} saw how hard you work and took over the ${name} for free!`, 'important', 'tie');
      if (!this.ui.hasPanel) showManagerIntro(this, 0);
    }
    const target = managerTipTarget(s);
    this.tipSeconds = target === this.tipTarget ? this.tipSeconds + 1 : 0;
    this.tipTarget = target;
    if (target >= 0 && this.tab !== 'managers' && managerTipDue(this.tipSeconds)) {
      this.ui.toast(managerTipMessage(s, target, fmt(managerCost(s, target))), 'tip', 'tie');
    }
    if (accessoryTipDue(s) && !this.removeAccessoryTip && this.tab !== 'cattery') {
      this.removeAccessoryTip = showAccessoryTip(this, () => this.dismissAccessoryTip());
      this.sfx.play('notify');
    }
  }

  private awardTick() {
    this.earlyTips();
    if (this.s.foundFish) {
      this.ui.toast(`Lucky find: +${this.s.foundFish} Golden Fish!`, 'currency', 'fish');
      this.s.foundFish = 0;
    }
    const got = checkAwards(this.s);
    this.refreshUnlocks();
    if (got.length) this.save();
    got.forEach((a) => this.ui.toast(`${a.name}  +${a.fish} Fish`, a.fish >= 50 ? 'rare' : 'award', a.icon));
    if (got.length && this.tab === 'awards') this.rebuild();
    if (!this.s.victoryShown && !this.touring && isVictory(this.s)) showVictory(this);
  }
}
