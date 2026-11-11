export type Business = {
  name: string;
  baseCost: number;
  coef: number;
  time: number;
  revenue: number;
  manager: string;
  /** Shown when the manager is hired. */
  personality: string;
  intro: string;
  managerCost: number;
};

export const MAX_BUSINESS_LEVEL = 1000;

// Tuned against the phase targets in logic/balance.ts: run `node src/logic/balance.ts` after any change here.
export const BUSINESSES: Business[] = [
  { name: 'Yarn Ball Stand', baseCost: 4, coef: 1.09, time: 0.6, revenue: 1, manager: 'Whiskers McGee', personality: "The Clueless One", intro: "Thanks for hiring me, boss! I've sold yarn for years. Nobody told me it wasn't food, so there's less stock than you'd expect.", managerCost: 800 },
  { name: 'Milk Bar', baseCost: 150, coef: 1.15, time: 3, revenue: 15, manager: 'Mittens', personality: "The Insecure One", intro: "You... you really picked me? Was the other cat busy? It's fine. I can leave if you want. Should I leave? Sorry. Thank you. Sorry.", managerCost: 8e3 },
  { name: 'Cardboard Box Factory', baseCost: 2500, coef: 1.14, time: 6, revenue: 135, manager: 'Sir Pounce-a-lot', personality: "The Strict One", intro: "Your gratitude is noted. Naps are now scheduled, boxes inspected, and the intern has been fined for breathing loudly. Thank you for hiring me.", managerCost: 6e4 },
  { name: 'Catnip Farm', baseCost: 40e3, coef: 1.13, time: 12, revenue: 1080, manager: 'Lady Marmalade', personality: "The Conspiracy Theorist", intro: "Thanks for the job. They say catnip grows from soil. Who's \"they\"? Who owns the soil? Don't answer, this farm is bugged.", managerCost: 6e5 },
  { name: 'Cat Café', baseCost: 500e3, coef: 1.12, time: 24, revenue: 30e3, manager: 'Biscuit', personality: "The Chilled-Out One", intro: "Thanks, friend. I swapped the coffee for warm milk and the prices for good vibes. Is that legal? Anyway, I'm napping till Tuesday.", managerCost: 6e6 },
  { name: 'Tuna Cannery', baseCost: 6e6, coef: 1.11, time: 96, revenue: 800e3, manager: 'Captain Tuna', personality: "The Dramatic Pirate", intro: "Aye, ye chose well! I've sailed seven seas and sunk six of 'em. Thank ye for the ship. Why is it a cannery? Never mind, I'm staying.", managerCost: 5e7 },
  { name: 'Scratching Post Co.', baseCost: 60e6, coef: 1.1, time: 384, revenue: 12e6, manager: 'Professor Paws', personality: "The Pedant", intro: "Thank you. It's \"Professor\", technically. I've written 400 pages on why scratching is economics. You will read them. There is a test.", managerCost: 4e8 },
  { name: 'Luxury Cat Hotel', baseCost: 600e6, coef: 1.09, time: 1536, revenue: 150e6, manager: 'Duchess Fluffington', personality: "The Snob", intro: "How delightful of you to ask. I shan't be touching money, guests or the floor. You may thank me on your way out, quietly.", managerCost: 3e9 },
  { name: 'Laser Pointer Inc.', baseCost: 6e9, coef: 1.08, time: 6144, revenue: 2e9, manager: 'Agent Shadow', personality: "The Secret Agent", intro: "You never hired me. We never spoke. Thanks, by the way. I've tracked the red dot for nine years, and it knows your name.", managerCost: 3e10 },
  { name: 'Cat Space Program', baseCost: 60e9, coef: 1.07, time: 36864, revenue: 50e9, manager: 'Cosmo the Astrocat', personality: "The Hopeless Dreamer", intro: "Thank you! I'm told nothing falls in space, so I can't knock anything off a table. I've never been so sad. Let's go anyway!", managerCost: 3e11 },
];

/** Owning this many of a business doubles its speed. */
export const MILESTONES = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
