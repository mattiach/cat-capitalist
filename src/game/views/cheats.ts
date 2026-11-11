import { CHEATS, redeemCheat } from '../../logic/cheats.ts';
import { hex } from '../art/color.ts';
import { C, CX, CY, GOLD, MUTED } from '../constants.ts';
import type { GameScene } from '../GameScene.ts';
import { revealCat } from '../ui/catReveal.ts';

export function cheatsView(game: GameScene) {
  const { ui } = game;
  ui.title('Cheats', 'Enter a code to claim a one-time reward.');
  ui.button(CX + 62, CY + 76, 110, 42, 'Back', C.grey, () => {
    game.sfx.play('tab');
    game.show('profile');
  }, 16, 'arrowLeft');
  const left = CX + 150;
  const top = CY + 50;
  const width = 748;
  ui.box(left, top, width, 530);
  ui.txt(CX + 524, top + 38, 'A little boost for your cat empire', 22, '#ffffff', true).setOrigin(0.5);

  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 24;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Cheat code');
  Object.assign(input.style, {
    width: '420px', height: '54px', boxSizing: 'border-box', padding: '0 18px',
    border: '2px solid #80669a', borderRadius: '12px', outline: 'none',
    background: '#21162d', color: '#ffffff', font: '700 20px Fredoka, sans-serif',
    letterSpacing: '1px', textAlign: 'center', textTransform: 'uppercase',
  });
  input.addEventListener('focus', () => { input.style.borderColor = '#ffad55'; });
  input.addEventListener('blur', () => { input.style.borderColor = '#80669a'; });
  ui.own(game.add.dom(CX + 524, top + 124, input));

  const status = ui.txt(CX + 524, top + 230, 'Rewards are saved with your game.', 16, MUTED)
    .setOrigin(0.5)
    .setWordWrapWidth(width - 48);
  const cards = CHEATS.map((cheat, index) => {
    const x = left + 18 + (index % 3) * 238;
    const y = top + 264 + Math.floor(index / 3) * 116;
    ui.box(x, y, 220, 104, C.dark, 12);
    const redeemed = game.s.redeemedCheats.includes(cheat.code);
    const name = ui.txt(x + 110, y + 24, redeemed ? cheat.code : '', 18, hex(C.orange), true).setOrigin(0.5);
    const censor = game.add.graphics();
    ui.own(censor);
    const palette = [0x21162d, 0x30203f, 0x39274e, 0x50386b, 0x655575];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 16; col++) {
        const shade = palette[(col * 3 + row * 5 + index * 7 + (col * row) % 5) % palette.length];
        censor.fillStyle(shade, 0.96).fillRect(x + 54 + col * 7, y + 14 + row * 5, 7, 5);
      }
    }
    censor.setVisible(!redeemed);
    ui.txt(x + 110, y + 54, cheat.reward, 14, '#ffffff').setOrigin(0.5).setWordWrapWidth(200).setAlign('center');
    const used = ui.txt(x + 110, y + 80, '', 13, MUTED, true).setOrigin(0.5);
    return { code: cheat.code, name, censor, used };
  });

  const submit = () => {
    const result = redeemCheat(game.s, input.value);
    status.setText(result.message).setColor(result.ok ? hex(C.green) : hex(C.pink));
    game.sfx.play(result.ok ? 'confirm' : 'error');
    if (!result.redeemed) return;
    input.value = '';
    if (result.ok) ui.burst(CX + 524, top + 124, C.gold);
    game.save();
    if (result.cat) revealCat(game, result.cat);
  };
  ui.button(CX + 524, top + 187, 220, 44, 'Redeem code', C.orange, submit);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  });

  let lastRedeemed = '';
  return () => {
    const redeemed = game.s.redeemedCheats.join('|');
    if (redeemed === lastRedeemed) return;
    lastRedeemed = redeemed;
    cards.forEach(({ code, name, censor, used }) => {
      const isUsed = game.s.redeemedCheats.includes(code);
      name.setText(isUsed ? code : '');
      censor.setVisible(!isUsed);
      used.setText(isUsed ? 'Used' : '').setColor(GOLD);
    });
  };
}
