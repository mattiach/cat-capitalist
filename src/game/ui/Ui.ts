import Phaser from 'phaser';
import { hex, luma, shade } from '../art/color.ts';
import { drawIcon, type IconName } from '../art/icons.ts';
import { C, CX, CY, FONT, MUTED, RED, ROW_H, ROW_W, textRes, VIEW_H, VIEW_W } from '../constants.ts';
import type { Sfx } from '../sfx.ts';
import type { Cue } from '../sfxCues.ts';

export type ToastKind = 'info' | 'tip' | 'important' | 'currency' | 'cat' | 'award' | 'upgrade' | 'music' | 'rare' | 'diamond';

/** Look and sound of each notification. `big` ones get the center-stage banner, glow and sparkles. */
const TOASTS: Record<ToastKind, { title: string; icon: IconName; color: number; cue: Cue; big?: boolean }> = {
  info: { title: 'MEOW!', icon: 'paw', color: C.orange, cue: 'notify' },
  currency: { title: 'PAYDAY', icon: 'coin', color: C.green, cue: 'coin' },
  cat: { title: 'CAT NEWS', icon: 'catFace', color: C.pink, cue: 'stray' },
  award: { title: 'AWARD UNLOCKED', icon: 'trophy', color: C.gold, cue: 'award' },
  upgrade: { title: 'UPGRADE', icon: 'arrowUp', color: 0x4da3ff, cue: 'purchase' },
  music: { title: 'MUSIC', icon: 'note', color: 0xb06bff, cue: 'select' },
  tip: { title: 'CAT TIP', icon: 'paw', color: C.orange, cue: 'notify', big: true },
  important: { title: 'IMPORTANT', icon: 'star', color: C.gold, cue: 'rare', big: true },
  rare: { title: 'RARE REWARD', icon: 'star', color: C.gold, cue: 'rare', big: true },
  diamond: { title: 'DIAMOND!', icon: 'diamond', color: C.diamond, cue: 'diamond', big: true },
};
const MAX_TOASTS = 3;
const TOAST_TOP = 104;
const TOAST_RIGHT = VIEW_W - 12;
const TOAST_GAP = 10;

/** A named icon, or a function drawing a custom one of radius r at (x, y). */
export type ToastIcon = IconName | ((x: number, y: number, r: number) => Phaser.GameObjects.Container);
type ToastRequest = { message: string; kind: ToastKind; icon?: ToastIcon; cue?: Cue };
type ToastCard = { box: Phaser.GameObjects.Container; h: number };

export type Button = {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  setColor: (c: number) => void;
  setDisabled: (disabled: boolean) => void;
  setVisible: (visible: boolean) => void;
  /** Sets the text and an optional icon beside it (or alone, with empty text), centered together. */
  setLabel: (label: string, icon?: IconName, iconAfter?: boolean) => void;
};

/** Widget toolkit for one scene. Objects created inside `within()` are added to that container. */
export class Ui {
  private readonly scene: Phaser.Scene;
  private readonly sfx: Sfx;
  private readonly reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  private into?: Phaser.GameObjects.Container;
  private panel?: Phaser.GameObjects.Container;
  get hasPanel() { return !!this.panel; }
  private toastQueue: ToastRequest[] = [];
  private toastCards: ToastCard[] = [];
  private bannerUp = false;

  constructor(scene: Phaser.Scene, sfx: Sfx) {
    this.scene = scene;
    this.sfx = sfx;
  }

  own<T extends Phaser.GameObjects.GameObject>(o: T) {
    this.into?.add(o);
    return o;
  }

  within<T>(c: Phaser.GameObjects.Container, build: () => T): T {
    const prev = this.into;
    this.into = c;
    try {
      return build();
    } finally {
      this.into = prev;
    }
  }

  txt(x: number, y: number, text: string, size = 18, color = '#ffffff', bold = false) {
    const style = { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : '', resolution: textRes(this.scene), padding: { y: 3 } };
    return this.own(this.scene.add.text(x, y, text, style));
  }

  /**
   * Left-aligned text where every digit takes the same width (like tabular numbers),
   * so a changing value doesn't make the characters after it wobble.
   */
  tabular(x: number, y: number, size: number, color: string) {
    const widths = new Map<string, number>();
    const measure = (ch: string) => {
      if (!widths.has(ch)) {
        const probe = this.txt(0, 0, ch, size, color, true);
        widths.set(ch, probe.width);
        probe.destroy();
      }
      return widths.get(ch)!;
    };
    const digit = Math.max(...[...'0123456789'].map(measure));
    const cells: Phaser.GameObjects.Text[] = [];
    return {
      setText: (text: string) => {
        const chars = [...text];
        let cx = x;
        chars.forEach((ch, i) => {
          const w = ch >= '0' && ch <= '9' ? digit : measure(ch);
          cells[i] ??= this.txt(0, y, '', size, color, true).setOrigin(0.5, 0);
          cells[i].setText(ch).setPosition(cx + w / 2, y).setVisible(true);
          cx += w;
        });
        cells.slice(chars.length).forEach((c) => c.setVisible(false));
      },
    };
  }

  rect(x: number, y: number, w: number, h: number, color: number, radius = 12, alpha = 1) {
    const r = this.scene.add.rectangle(x, y, w, h, color, alpha);
    return this.own(radius ? r.setRounded(radius) : r);
  }

  /** Card with a soft drop shadow; (x, y) is the top-left corner. */
  box(x: number, y: number, w: number, h: number, color = C.card, radius = 14) {
    const shadow = this.rect(x + w / 2, y + h / 2 + 4, w, h, 0x000000, radius, 0.25);
    const panel = this.rect(x + w / 2, y + h / 2, w, h, color, radius).setStrokeStyle(1, 0xffffff, 0.08);
    if (!this.reduceMotion) {
      shadow.setAlpha(0).setScale(0.97);
      panel.setAlpha(0).setScale(0.97);
      this.scene.tweens.add({ targets: [shadow, panel], alpha: 1, scale: 1, duration: 180, ease: 'Back.Out' });
    }
    return panel;
  }

  button(x: number, y: number, w: number, h: number, label: string, color: number, onClick: () => void, size = 17, startIcon?: IconName): Button {
    const shadow = this.rect(x, y + 4, w, h, shade(color, 0.6), 10);
    const bg = this.rect(x, y, w, h, color, 10).setInteractive({ useHandCursor: true });
    const buttonTextColor = (fill: number) => luma(fill) >= 0.68 ? hex(C.dark) : '#ffffff';
    const text = this.txt(x, y, label, size, buttonTextColor(color), true).setOrigin(0.5);
    let disabled = false;
    let iconName: IconName | undefined;
    let icon: Phaser.GameObjects.Container | undefined;
    const iconRadius = Math.min(size * 0.62, h * 0.34);
    const scaleAll = (value: number) => [bg, shadow, text, icon].forEach((part) => part?.setScale(value));
    const setLabel = (value: string, nextIcon?: IconName, iconAfter = false) => {
      text.setText(value);
      if (nextIcon !== iconName) {
        icon?.destroy();
        icon = nextIcon && drawIcon(this.scene, x, y, iconRadius, nextIcon);
        if (icon) bg.parentContainer?.add(icon);
        iconName = nextIcon;
      }
      if (!icon) return void text.setX(x);
      const textWidth = value ? text.width + 7 : 0;
      const total = textWidth + iconRadius * 2;
      const left = x - total / 2;
      icon.setX(iconAfter ? left + textWidth + iconRadius : left + iconRadius);
      text.setX(iconAfter ? left + (textWidth - 7) / 2 : left + iconRadius * 2 + 7 + (textWidth - 7) / 2);
      icon.setAlpha(disabled ? 0.8 : 1);
    };
    if (startIcon) setLabel(label, startIcon);
    bg.on('pointerover', () => {
      if (disabled) return;
      bg.setAlpha(0.96).setStrokeStyle(2, 0xffffff, 0.35);
      if (!this.reduceMotion) scaleAll(1.025);
    });
    bg.on('pointerout', () => {
      if (disabled) return;
      bg.setAlpha(1).setStrokeStyle();
      scaleAll(1);
    });
    bg.on('pointerdown', () => {
      if (disabled) return;
      bg.y = text.y = y + 3;
      if (icon) icon.y = y + 3;
      if (!this.reduceMotion) scaleAll(0.97);
      this.scene.time.delayedCall(90, () => {
        bg.y = text.y = y;
        if (icon?.active) icon.y = y;
        scaleAll(1);
      });
      // A plain click only when the action made no sound of its own, so purchases don't double up.
      const before = this.sfx.plays;
      onClick();
      if (this.sfx.plays === before) this.sfx.play('click');
    });
    return {
      bg,
      text,
      setLabel,
      setColor: (c) => { bg.setFillStyle(c); shadow.setFillStyle(shade(c, 0.6)); text.setColor(buttonTextColor(c)); },
      setDisabled: (value) => {
        if (disabled === value) return;
        disabled = value;
        if (disabled) {
          bg.disableInteractive(true).setAlpha(1).setStrokeStyle(1, 0xffffff, 0.16).setScale(1);
          shadow.setAlpha(0.35).setScale(1);
          text.setAlpha(0.9).setScale(1);
        } else {
          bg.setInteractive({ useHandCursor: true }).setAlpha(1).setStrokeStyle();
          shadow.setAlpha(1);
          text.setAlpha(1);
        }
      },
      setVisible: (visible) => {
        bg.setVisible(visible);
        shadow.setVisible(visible);
        text.setVisible(visible);
        icon?.setVisible(visible);
      },
    };
  }

  /** The list row used by every paginated list: icon disc, title, subtitle, optional third line, and a spot for its button. */
  itemRow(x: number, y: number, icon: IconName | ((x: number, y: number, r: number) => Phaser.GameObjects.Container), title: string, subtitle: string, withNote = false) {
    const card = this.box(x, y, ROW_W, ROW_H, C.card, 14);
    const cy = y + ROW_H / 2;
    this.rect(x + 40, cy, 52, 52, C.dark, 26);
    const iconObject = typeof icon === 'string' ? this.icon(x + 40, cy, 19, icon) : this.own(icon(x + 40, cy, 19));
    const top = withNote ? y + 8 : y + 13;
    const fit = (text: Phaser.GameObjects.Text) => text.setScale(Math.min(1, 270 / text.width));
    fit(this.txt(x + 76, top, title, 17, '#ffffff', true));
    const sub = fit(this.txt(x + 76, top + 24, subtitle, 13, MUTED));
    const note = this.txt(x + 76, top + 42, '', 12, MUTED);
    return { card, icon: iconObject, sub, note, buttonX: x + 436, buttonY: cy };
  }

  /** Prev / page label / Next row; a star on an arrow says something new waits on that side. */
  pager(x: number, y: number, gap: number, turn: (dir: 1 | -1) => void) {
    const label = this.txt(x, y, '', 14, MUTED).setOrigin(0.5);
    const prev = this.button(x - gap, y, 90, 30, 'Prev', C.cardLight, () => turn(-1), 13, 'arrowLeft');
    const next = this.button(x + gap, y, 90, 30, 'Next', C.cardLight, () => turn(1), 13);
    next.setLabel('Next', 'arrowRight', true);
    return (page: number, pageCount: number, newBefore = false, newAfter = false, detail = '') => {
      label.setText(`Page ${page + 1} / ${pageCount}${detail}`);
      prev.setLabel('Prev', newBefore ? 'star' : 'arrowLeft');
      next.setLabel('Next', newAfter ? 'star' : 'arrowRight', true);
      prev.setDisabled(page === 0);
      next.setDisabled(page >= pageCount - 1);
      prev.setColor(page === 0 ? C.unavailable : C.cardLight);
      next.setColor(page >= pageCount - 1 ? C.unavailable : C.cardLight);
    };
  }

  /** Named icon, added to the current container. */
  icon(x: number, y: number, r: number, name: IconName) {
    return this.own(drawIcon(this.scene, x, y, r, name));
  }

  /** Icon and text side by side, centered on x as a pair. */
  iconText(x: number, y: number, name: IconName, r: number, text: string, size = 18, color = '#ffffff', bold = false) {
    const label = this.txt(0, y, text, size, color, bold).setOrigin(0, 0.5);
    const total = r * 2 + 8 + label.width;
    const icon = this.icon(x - total / 2 + r, y, r, name);
    label.setX(x - total / 2 + r * 2 + 8);
    return { icon, label };
  }

  /** Big view title on the left, hint on the right. */
  title(title: string, subtitle: string) {
    this.rect(CX - 10, CY + 14, 4, 34, C.orange, 2);
    this.txt(CX, CY - 4, title, 30, hex(C.orange), true);
    return this.txt(CX + 1048, CY + 10, subtitle, 15, MUTED).setOrigin(1, 0);
  }

  /** An icon that rises, fades out and removes itself; for brief reactions that shouldn't stay on screen. */
  floatIcon(x: number, y: number, r: number, name: IconName) {
    const icon = drawIcon(this.scene, x, y, r, name).setDepth(12);
    this.scene.tweens.add({ targets: icon, y: y - 44, alpha: 0, duration: 900, ease: 'Sine.Out', onComplete: () => icon.destroy() });
  }

  /** Small gold "NEW" pill for a freshly unlocked item; (x, y) is its center. */
  newTag(x: number, y: number) {
    const pill = this.scene.add.rectangle(0, 0, 36, 16, C.gold).setRounded(8);
    const label = this.scene.add.text(0, 0, 'NEW', { fontFamily: FONT, fontSize: '11px', color: hex(C.dark), fontStyle: 'bold', resolution: textRes(this.scene) }).setOrigin(0.5);
    return this.own(this.scene.add.container(x, y, [pill, label]));
  }

  floatText(x: number, y: number, text: string, color = '#ffd166') {
    if (color === RED) this.sfx.play('error'); // red float text is how every refused action reports itself
    // Above modal panels too, because panels report failed purchases with it.
    const t = this.scene.add.text(x, y, text, { fontFamily: FONT, fontSize: '20px', color, fontStyle: 'bold', resolution: textRes(this.scene) })
      .setOrigin(0.5).setDepth(12).setStroke('#1c1229', 4);
    this.scene.tweens.add({ targets: t, y: y - 50, duration: 1100, ease: 'Power2' });
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 600, duration: 500, onComplete: () => t.destroy() });
  }

  /**
   * Game notification. Everyday kinds stack on the right, at most three at a time; rare kinds get one
   * banner at center stage. Extras wait in line, and everything waits while a modal is open.
   * Notifications ignore the pointer, so they never block a click on what's underneath.
   * The sound comes with the notification, so it is heard when it appears. `cue` overrides the kind's usual one.
   */
  toast(message: string, kind: ToastKind = 'info', icon?: ToastIcon, cue?: Cue) {
    this.toastQueue.push({ message, kind, icon, cue });
    this.pumpToasts();
  }

  private pumpToasts() {
    if (this.panel) return;
    this.toastQueue = this.toastQueue.filter((request) => {
      const big = TOASTS[request.kind].big;
      if (big ? this.bannerUp : this.toastCards.length >= MAX_TOASTS) return true;
      this.sfx.play(request.cue ?? TOASTS[request.kind].cue);
      if (big) this.showBanner(request);
      else this.showCard(request);
      return false;
    });
  }

  /** The shared look: rounded card, colored icon badge, kind title, message. */
  private buildToast({ message, kind, icon }: ToastRequest, big: boolean) {
    const style = TOASTS[kind];
    const res = textRes(this.scene);
    const badge = big ? 34 : 24;
    const textX = badge * 2 + 12;
    const title = this.scene.add.text(0, 0, style.title, { fontFamily: FONT, fontSize: big ? '16px' : '12px', color: hex(style.color), fontStyle: 'bold', resolution: res });
    const body = this.scene.add.text(0, 0, message, {
      fontFamily: FONT, fontSize: big ? '21px' : '15px', color: '#ffffff', fontStyle: 'bold', resolution: res,
      wordWrap: { width: big ? 400 : 216 },
    });
    const w = Math.max(title.width, body.width) + textX + (big ? 24 : 16);
    const h = Math.max(badge * 2 + 8, title.height + body.height + (big ? 24 : 16));
    title.setPosition(-w / 2 + textX, -(title.height + body.height) / 2);
    body.setPosition(-w / 2 + textX, title.y + title.height);

    const shadow = this.scene.add.rectangle(0, 5, w, h, 0x000000, 0.35).setRounded(18);
    const card = this.scene.add.rectangle(0, 0, w, h, C.dark).setRounded(18).setStrokeStyle(big ? 4 : 2.5, style.color);
    const badgeX = -w / 2 + badge + 6;
    const disc = this.scene.add.circle(badgeX, 0, badge, shade(style.color, 0.55)).setStrokeStyle(2, style.color);
    const emoji = typeof icon === 'function' ? icon(badgeX, 0, badge * 0.72) : drawIcon(this.scene, badgeX, 0, badge * 0.72, icon ?? style.icon);
    const box = this.scene.add.container(0, 0, [shadow, card, disc, emoji, title, body]).setDepth(11);
    return { box, emoji, w, h, color: style.color };
  }

  private showCard(request: ToastRequest) {
    const { box, emoji, w, h } = this.buildToast(request, false);
    const entry: ToastCard = { box, h };
    const y = this.toastCards.reduce((sum, item) => sum + item.h + TOAST_GAP, TOAST_TOP) + h / 2;
    this.toastCards.push(entry);
    box.setPosition(TOAST_RIGHT - w / 2, y);
    if (!this.reduceMotion) {
      box.setPosition(TOAST_RIGHT + w, y);
      this.scene.tweens.add({ targets: box, x: TOAST_RIGHT - w / 2, duration: 340, ease: 'Back.Out' });
      this.pop(emoji);
    }
    this.scene.tweens.add({
      targets: box, alpha: 0, delay: this.toastQueue.length > 1 ? 2200 : 3400, duration: 260,
      onComplete: () => {
        box.destroy();
        this.toastCards.splice(this.toastCards.indexOf(entry), 1);
        this.layoutToasts();
        this.pumpToasts();
      },
    });
  }

  /** Closes the gap a finished card left, by sliding the rest up. */
  private layoutToasts() {
    let top = TOAST_TOP;
    for (const { box, h } of this.toastCards) {
      this.scene.tweens.add({ targets: box, y: top + h / 2, duration: this.reduceMotion ? 0 : 180, ease: 'Quad.Out' });
      top += h + TOAST_GAP;
    }
  }

  private showBanner(request: ToastRequest) {
    this.bannerUp = true;
    const x = CX + 524;
    const y = CY + 40;
    const { box, emoji, w, h, color } = this.buildToast(request, true);
    box.setPosition(x, y);
    const glow = this.scene.add.rectangle(x, y, w + 28, h + 28, color, 0.3).setRounded(28).setDepth(10.5);
    if (!this.reduceMotion) {
      box.setScale(0.4);
      this.scene.tweens.add({ targets: box, scale: 1, duration: 420, ease: 'Back.Out' });
      this.scene.tweens.add({ targets: glow, alpha: 0.08, scale: 1.08, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.scene.tweens.add({ targets: emoji, scale: 1.2, angle: { from: -8, to: 8 }, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      for (const side of [-1, 1]) this.burst(x + (side * w) / 2, y, color);
      this.burst(x, y - h / 2, C.gold);
    }
    this.scene.tweens.add({
      targets: [box, glow], alpha: 0, delay: 4600, duration: 320,
      onComplete: () => {
        this.scene.tweens.killTweensOf([glow, emoji, box]);
        glow.destroy();
        box.destroy();
        this.bannerUp = false;
        this.pumpToasts();
      },
    });
  }

  pop(target: Phaser.GameObjects.Container) {
    if (this.reduceMotion) return;
    this.scene.tweens.add({ targets: target, scale: 1.22, duration: 110, yoyo: true, ease: 'Back.Out' });
  }

  /** Small reward burst used for purchases and business milestones. */
  burst(x: number, y: number, color = C.gold) {
    if (this.reduceMotion) return;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spark = this.scene.add.circle(x, y, 3, color).setDepth(6);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 28,
        y: y + Math.sin(angle) * 28,
        alpha: 0,
        scale: 0.2,
        duration: 360,
        ease: 'Quad.Out',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Modal dialog centered on screen; `build` adds its content. */
  openPanel(title: string, subtitle: string, h: number, build: () => void, onDismiss?: () => void) {
    this.removePanel();
    this.sfx.play('panelOpen');
    const top = VIEW_H / 2 - h / 2;
    // DOM elements (the cheat code input) draw above the canvas, so they hide behind a modal by hand.
    this.setDomVisible(false);
    this.panel = this.scene.add.container(0, 0).setDepth(10);
    this.within(this.panel, () => {
      this.rect(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, 0x000000, 0, 0.65).setInteractive();
      this.rect(VIEW_W / 2, VIEW_H / 2, 760, h, C.card, 24).setStrokeStyle(4, C.orange);
      this.txt(VIEW_W / 2, top + 40, title, 30, hex(C.orange), true).setOrigin(0.5);
      this.txt(VIEW_W / 2, top + 80, subtitle, 16, MUTED).setOrigin(0.5);
      this.button(VIEW_W / 2 + 340, top + 36, 40, 40, '', C.grey, () => onDismiss ? onDismiss() : this.closePanel(), 17, 'close');
      build();
    });
  }

  closePanel() {
    if (this.panel) this.sfx.play('panelClose');
    this.removePanel();
  }

  private removePanel() {
    if (this.panel) this.scene.tweens.killTweensOf(this.panel.list);
    this.panel?.destroy();
    this.panel = undefined;
    this.setDomVisible(true);
    // Next frame, so a modal replacing this one holds the queue back.
    this.scene.time.delayedCall(0, () => this.pumpToasts());
  }

  setDomVisible(visible: boolean) {
    const { domContainer } = this.scene.game;
    if (domContainer) domContainer.style.visibility = visible ? '' : 'hidden';
  }
}
