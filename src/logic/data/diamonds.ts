/** Chance that a clicked stray cat carries a Diamond. */
export const STRAY_DIAMOND_CHANCE = 0.01;
/** Paid once per cat, the first time a Legendary cat that has no Diamond price is discovered. */
export const LEGENDARY_DISCOVERY_DIAMONDS = 1;

/** Cats sold in the Cat Lounge for Diamonds. Add a row to sell another breed + coat combination. */
export const DIAMOND_CATS = [
  { breed: 2, coat: 6, price: 3 }, // Lilac Siamese
  { breed: 5, coat: 6, price: 4 }, // Lilac Bengal
  { breed: 6, coat: 4, price: 5 }, // Chocolate Sphynx
  { breed: 4, coat: 7, price: 8 }, // Golden Maine Coon
  { breed: 6, coat: 7, price: 10 }, // Golden Sphynx
  { breed: 7, coat: 7, price: 12 }, // Golden Savannah
];
