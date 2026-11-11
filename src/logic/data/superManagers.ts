export type SuperReward = { kind: 'diamond' } | { kind: 'zoomies' } | { kind: 'angel' } | { kind: 'fish'; amount: number };

export type SuperManager = {
  name: string;
  /** Shown when the super manager is hired. */
  personality: string;
  intro: string;
  cost: number;
  reward: SuperReward;
};

/** Owning this business, ever, opens the Super Managers tab. Buying the first one pays 1 Diamond once. */
export const TUNA_CANNERY = 5;
/** A super manager multiplies their business's profits by this, for good. */
export const SUPER_MULT = 5;
export const SUPER_ZOOMIES_TIME = 60;

// Indexed like BUSINESSES. Tuned against logic/balance.ts: run `node src/logic/balance.ts` after any change here.
export const SUPER_MANAGERS: SuperManager[] = [
  { name: 'Baroness Purl', personality: 'The Knitting Tycoon', intro: "Yarn is not a toy, darling, it is a commodity. I have cornered the wool market and I'm only mildly tangled.", cost: 1e9, reward: { kind: 'zoomies' } },
  { name: 'Dr. Creamsworth', personality: 'The Dairy Scientist', intro: "I've made milk 900% more milky. Peer review was a bowl. It came back empty, which I consider unanimous.", cost: 15e9, reward: { kind: 'fish', amount: 125 } },
  { name: 'Chairman Boxley', personality: 'The Corporate Shark', intro: "If it fits, it ships. If it doesn't fit, I sit in it until it does. Our shareholders are thrilled and also inside the box.", cost: 250e9, reward: { kind: 'angel' } },
  { name: 'Sage Nepeta', personality: 'The Enlightened One', intro: "The catnip spoke to me. It said buy more land. Then it said the ceiling is delicious. I'm following only the first part.", cost: 4e12, reward: { kind: 'zoomies' } },
  { name: 'Maestro Espurresso', personality: 'The Tortured Artist', intro: "Each foam heart is a piece of my soul. That'll be forty dollars. No, you may not have it to go. It must be mourned here.", cost: 60e12, reward: { kind: 'fish', amount: 125 } },
  { name: 'Admiral Bluefin', personality: 'The Fleet Commander', intro: "Captain Tuna works for me now. Say nothing of it. He still thinks the cannery is a ship, and morale has never been better.", cost: 1e15, reward: { kind: 'diamond' } },
  { name: 'Dean Clawdia', personality: 'The Tenured Terror', intro: "I have failed the Professor's thesis and scratched my own on top of it. Productivity is up. Furniture is down.", cost: 15e15, reward: { kind: 'fish', amount: 250 } },
  { name: 'Empress Velvet', personality: 'The Living Legend', intro: "The Duchess may carry my pillow. Every suite now has a window, a sunbeam, and a little sign saying it was my idea.", cost: 250e15, reward: { kind: 'angel' } },
  { name: 'Director Red', personality: 'The Spymaster', intro: "I caught the red dot. We talked. It works for us now, and this conversation will self-destruct if you blink first.", cost: 4e18, reward: { kind: 'zoomies' } },
  { name: 'Galactic Overlord Fluff', personality: 'The Cosmic Ruler', intro: "At last, a table the size of a galaxy, and planets sitting right at the edge of it. You may want to look away.", cost: 60e18, reward: { kind: 'diamond' } },
];
