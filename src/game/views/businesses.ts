import { BUSINESSES, MAX_BUSINESS_LEVEL } from '../../logic/data/businesses.ts';
import { buy, cost, cycleTime, maxAffordable, nextMilestone, revenue } from '../../logic/economy.ts';
import { SUPER_MULT } from '../../logic/data/superManagers.ts';
import { fmt, fmtTime } from '../../logic/format.ts';
import { drawBusinessIcon } from '../art/businessIcon.ts';
import { BUY_MODES, C, CX, CY, GOLD, MUTED, RED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

const cardPos = (i: number) => ({ x: CX + (i < 5 ? 0 : 532), y: CY + (i % 5) * 122 });

function buyCount(game: GameScene, i: number) {
  if (game.s.biz[i].owned === 0) return 1;
  const mode = BUY_MODES[game.buyMode];
  const remaining = MAX_BUSINESS_LEVEL - game.s.biz[i].owned;
  if (remaining <= 0) return 0;
  return mode === 'MAX' ? Math.max(1, Math.min(remaining, maxAffordable(i, game.s.biz[i].owned, game.s.money))) : Math.min(mode, remaining);
}

function buyBusiness(game: GameScene, i: number, icon: Phaser.GameObjects.Container) {
  const { s, ui } = game;
  const { x, y } = cardPos(i);
  if (s.biz[i].owned >= MAX_BUSINESS_LEVEL) return;
  const before = { owned: s.biz[i].owned, fish: s.fish, diamonds: s.diamonds };
  if (!buy(s, i, buyCount(game, i))) return ui.floatText(x + 226, y + 68, 'Not enough money!', RED);
  game.clearNew(i);
  game.save();
  if (i === 0 && !s.yarnBonusAt && !s.yarnBonusClaimed) {
    s.yarnBonusAt = Date.now() + 13000;
    game.scheduleYarnBonus();
    game.save();
  }
  ui.pop(icon);
  ui.burst(x + 54, y + 50, C.green);
  const leveledUp = nextMilestone(before.owned) !== nextMilestone(s.biz[i].owned);
  game.sfx.play(before.owned === 0 ? 'unlockBusiness' : leveledUp ? 'milestone' : 'buy');
  if (leveledUp) {
    ui.floatText(x + 304, y + 30, 'Speed x2!');
    ui.burst(x + 54, y + 50, C.orange);
    ui.toast(`${BUSINESSES[i].name} leveled up!`, 'upgrade', 'bolt', 'milestone');
  }
  if (s.diamonds > before.diamonds) ui.toast('+1 Diamond · Super Managers unlocked!', 'diamond');
  if (s.fish > before.fish) ui.toast(`+${s.fish - before.fish} Golden Fish · ${BUSINESSES[i].name} milestone`, 'currency', 'fish', 'fish');
}

export function businessesView(game: GameScene) {
  const { ui } = game;
  const cards = BUSINESSES.map((biz, i) => {
    const { x, y } = cardPos(i);
    ui.box(x, y, 516, 112);
    const start = () => {
      const b = game.s.biz[i];
      if (!b.owned || b.manager || b.running) return;
      b.running = true;
      game.save();
      game.sfx.play('tick');
      ui.pop(icon);
    };
    // A golden sunburst behind the icon marks a business boosted by its super manager.
    const burst = ui.own(game.add.star(x + 54, y + 50, 14, 41, 49, C.gold));
    const ring = ui.own(game.add.circle(x + 54, y + 50, 42, C.cardLight)).setInteractive({ useHandCursor: true }).on('pointerdown', start);
    // Purely visual: clicks and hover land on the ring behind it, which is larger.
    const icon = ui.own(drawBusinessIcon(game, x + 54, y + 50, 33, i));
    const setHover = (active: boolean) => {
      icon.setScale(active ? 1.12 : 1);
      ring.setStrokeStyle(active ? 3 : 0, active ? C.gold : C.cardLight, active ? 0.9 : 0);
    };
    ring.on('pointerover', () => setHover(true)).on('pointerout', () => setHover(false));
    const lock = ui.icon(x + 78, y + 74, 11, 'lock');
    ui.rect(x + 54, y + 96, 60, 22, C.dark, 8);
    const owned = ui.txt(x + 54, y + 96, '', 14, '#ffffff', true).setOrigin(0.5);
    const name = ui.txt(x + 106, y + 6, biz.name, 19, '#ffffff', true);
    const milestone = ui.txt(x + 502, y + 10, '', 13, MUTED).setOrigin(1, 0);
    const milestoneIcon = ui.icon(x + 502, y + 19, 7, 'bolt');
    ui.rect(x + 304, y + 53, 396, 30, C.dark, 10);
    const bar = ui.own(game.add.graphics());
    const barText = ui.txt(x + 304, y + 53, '', 17, '#ffffff', true).setOrigin(0.5).setStroke('#1c1229', 4);
    const buyBtn = ui.button(x + 226, y + 90, 240, 30, '', C.green, () => buyBusiness(game, i, icon), 15);
    ui.rect(x + 429, y + 90, 146, 30, C.dark, 10);
    const time = ui.txt(x + 429, y + 90, '', 17, '#ffffff', true).setOrigin(0.5);
    return { x, y, burst, name, ring, icon, lock, owned, milestone, milestoneIcon, bar, barText, buyBtn, time, newTag: ui.newTag(x + 24, y + 12) };
  });

  let wasRunning = game.s.biz.map((b) => b.running);
  return () => {
    const s = game.s;
    cards.forEach((c, i) => {
      const b = s.biz[i];
      c.newTag.setVisible(game.isNew(i));
      if (wasRunning[i] && !b.running && !b.manager) { // manual cycle paid out; managed ones stay silent, they never stop
        ui.floatText(c.x + 304, c.y + 38, '+' + fmt(revenue(s, i)));
        game.sfx.play('collect');
      }
      const t = cycleTime(i, b.owned, s);
      const n = buyCount(game, i);
      const price = cost(i, b.owned, n);
      const next = nextMilestone(b.owned);
      const active = b.running || b.manager;
      const boosted = Boolean(s.superManagers[i]);
      c.burst.setVisible(boosted);
      c.name.setColor(boosted ? GOLD : '#ffffff').setText(boosted ? `${BUSINESSES[i].name} x${SUPER_MULT}` : BUSINESSES[i].name);
      c.ring.setFillStyle(boosted ? C.dark : C.cardLight).setStrokeStyle(3, boosted ? C.gold : !b.owned ? C.grey : active ? C.orange : C.green);
      c.icon.setAlpha(b.owned ? 1 : 0.35);
      c.lock.setVisible(!b.owned);
      c.owned.setText(String(b.owned));
      c.milestone.setText(next ? `x2 speed at ${next}` : 'Max speed!');
      c.milestoneIcon.setX(c.x + 502 - c.milestone.width - 10);
      // very fast managed cycles just show a full bar
      const w = 396 * (b.manager && t < 0.2 ? 1 : Math.min(1, b.progress / t));
      c.bar.clear();
      if (w >= 1) c.bar.fillStyle(boosted ? C.gold : b.manager ? C.pink : C.green).fillRoundedRect(c.x + 106, c.y + 38, w, 30, Math.min(10, w / 2));
      c.barText.setText(b.owned ? fmt(revenue(s, i)) : 'Locked');
      const maxed = b.owned >= MAX_BUSINESS_LEVEL;
      if (maxed) c.buyBtn.setLabel('Max level', 'check');
      else c.buyBtn.setLabel(`${b.owned ? 'Buy' : 'Unlock'} x${n}   ${fmt(price)}`);
      c.buyBtn.setDisabled(maxed);
      c.buyBtn.setColor(maxed ? C.grey : s.money >= price ? C.green : C.grey);
      c.time.setText(b.owned ? fmtTime(active ? t - b.progress : t) : '--:--:--');
    });
    wasRunning = s.biz.map((b) => b.running);
  };
}
