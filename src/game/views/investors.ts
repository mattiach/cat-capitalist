import { INVESTORS, type Investor } from '../../logic/data/investors.ts';
import { fmt, fmtTime } from '../../logic/format.ts';
import { collectInvestment, investorProfit, investorReturn, investorStatus, investorTimeLeft, startInvestment } from '../../logic/investors.ts';
import { hex } from '../art/color.ts';
import { drawCat } from '../art/drawCat.ts';
import { C, CX, CY, GOLD, MUTED, RED, VIEW_H, VIEW_W } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';

const H = 470;
/** What collecting pays, as an icon, a label and its color. */
function payout(investor: Investor) {
  const { trade } = investor;
  if (trade?.currency === 'fish') return { icon: 'fish', text: `${trade.amount} Golden Fish`, color: '#ffb347' } as const;
  if (trade) return { icon: 'diamond', text: `${trade.amount} ${trade.amount === 1 ? 'Diamond' : 'Diamonds'}`, color: hex(C.diamond) } as const;
  return { icon: 'coins', text: `${fmt(investorReturn(investor))} (+${fmt(investorProfit(investor))})`, color: GOLD } as const;
}

const STATUS_LABEL = { available: 'Available', investing: 'Investing', ready: 'Ready to collect', cooldown: 'Cooldown' };

/** The details of an offer, and the only way to accept it. */
function confirmInvestment(game: GameScene, investor: Investor) {
  const { ui } = game;
  const top = VIEW_H / 2 - H / 2;
  const cx = VIEW_W / 2;
  ui.openPanel(investor.name, investor.description, H, () => {
    ui.rect(cx, top + 165, 130, 130, C.dark, 65);
    ui.own(drawCat(game, cx, top + 168, 50, investor.look));
    const get = payout(investor);
    const rows = [
      ['You pay', fmt(investor.cost)],
      ['You get', investor.trade ? get.text : fmt(investorReturn(investor))],
      [investor.trade ? 'Money back' : 'Net profit', investor.trade ? 'None, it is a trade' : `+${fmt(investorProfit(investor))}`],
      ['Ready in', `${investor.minutes} min`],
      ['Cooldown after collecting', investor.cooldownMinutes ? `${investor.cooldownMinutes} min` : 'None'],
    ];
    rows.forEach(([label, value], k) => {
      ui.txt(cx - 200, top + 244 + k * 25, label, 16, MUTED).setOrigin(0, 0.5);
      ui.txt(cx + 200, top + 244 + k * 25, value, 16, k === 1 ? get.color : '#ffffff', true).setOrigin(1, 0.5);
    });
    ui.button(cx, top + 418, 240, 50, investor.trade ? 'Trade' : 'Invest', C.green, () => {
      if (!startInvestment(game.s, investor, Date.now())) return ui.floatText(cx, top + 386, 'Not enough money!', RED);
      game.save();
      game.sfx.play('purchase');
      ui.closePanel();
    });
  });
}

export function investorsView(game: GameScene) {
  const { ui } = game;
  ui.title('Investors', 'Pay money, wait, collect money, Golden Fish or Diamonds. Ascending cancels anything not collected.');
  const cards = INVESTORS.map((investor, i) => {
    const x = CX + (i % 2) * 532;
    const y = CY + 50 + Math.floor(i / 2) * 136;
    const card = ui.box(x, y, 516, 126);
    ui.own(drawCat(game, x + 50, y + 66, 30, investor.look));
    const fit = (text: Phaser.GameObjects.Text) => text.setScale(Math.min(1, 240 / text.width));
    const get = payout(investor);
    ui.txt(x + 96, y + 10, investor.name, 17, '#ffffff', true);
    fit(ui.txt(x + 96, y + 33, investor.description, 12, MUTED));
    ui.txt(x + 96, y + 62, 'Pay', 13, MUTED).setOrigin(0, 0.5);
    ui.icon(x + 144, y + 62, 8, 'coins');
    fit(ui.txt(x + 158, y + 62, fmt(investor.cost), 14, '#ffffff', true).setOrigin(0, 0.5));
    ui.txt(x + 96, y + 84, 'Get', 13, MUTED).setOrigin(0, 0.5);
    ui.icon(x + 144, y + 84, 8, get.icon);
    fit(ui.txt(x + 158, y + 84, get.text, 14, get.color, true).setOrigin(0, 0.5));
    fit(ui.txt(x + 96, y + 106, `${investor.minutes} min · ${investor.cooldownMinutes ? `${investor.cooldownMinutes} min cooldown` : 'no cooldown'}`, 12, MUTED).setOrigin(0, 0.5));
    const status = ui.txt(x + 425, y + 22, '', 13, MUTED, true).setOrigin(0.5);
    ui.rect(x + 425, y + 44, 150, 10, C.dark, 5);
    const bar = ui.own(game.add.graphics());
    const btn = ui.button(x + 425, y + 86, 150, 38, '', C.green, () => {
      const now = Date.now();
      const state = investorStatus(game.s, investor.id, now);
      if (state === 'available') {
        if (game.s.money < investor.cost) return ui.floatText(x + 425, y + 44, 'Not enough money!', RED);
        return confirmInvestment(game, investor);
      }
      if (state === 'ready' && collectInvestment(game.s, investor, now)) {
        game.save();
        ui.burst(x + 50, y + 66, C.gold);
        if (investor.trade?.currency === 'diamonds') ui.toast(`${investor.name} paid ${get.text}`, 'diamond');
        else ui.toast(`${investor.name} paid ${get.text}`, 'currency', get.icon, investor.trade ? 'fish' : 'collect');
      }
    }, 15);
    return { investor, x, y, card, status, bar, btn };
  });

  return () => {
    const now = Date.now();
    cards.forEach(({ investor, x, y, card, status, bar, btn }) => {
      const state = investorStatus(game.s, investor.id, now);
      const left = investorTimeLeft(game.s, investor.id, now);
      const affordable = game.s.money >= investor.cost;
      status.setText(STATUS_LABEL[state]).setColor(state === 'ready' ? GOLD : MUTED);
      if (state === 'ready') card.setStrokeStyle(3, C.gold);
      else card.setStrokeStyle(1, 0xffffff, 0.08);
      bar.clear();
      const total = state === 'investing' ? investor.minutes * 60 : state === 'cooldown' ? investor.cooldownMinutes * 60 : 0;
      const filled = state === 'ready' ? 1 : total ? (state === 'investing' ? 1 - left / total : left / total) : 0;
      if (filled * 150 >= 1) bar.fillStyle(state === 'cooldown' ? C.grey : state === 'ready' ? C.gold : C.pink).fillRoundedRect(x + 350, y + 39, filled * 150, 10, Math.min(5, filled * 75));
      btn.setLabel(state === 'available' ? (investor.trade ? 'Trade' : 'Invest') : state === 'ready' ? 'Collect' : fmtTime(left));
      btn.setDisabled(state === 'investing' || state === 'cooldown');
      btn.setColor(state === 'ready' ? C.gold : state === 'available' && affordable ? C.green : C.grey);
    });
  };
}
