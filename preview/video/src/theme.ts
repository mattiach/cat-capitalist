import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

// The game's own palette, from src/game/constants.ts and preview/src/16-9/shot.css.
export const colors = {
  bg: "#21152f",
  card: "#39274e",
  deep: "#140c1f",
  edge: "#50386b",
  gold: "#ffd166",
  green: "#32c982",
  ink: "#fff8ff",
  muted: "#c9b8e0",
  orange: "#ffad55",
  pink: "#ff78a8",
} as const;

export const font = 'Fredoka, "Trebuchet MS", sans-serif';

loadFont({
  family: "Fredoka",
  url: staticFile("fonts/fredoka-latin-wght-normal.woff2"),
  weight: "300 700",
});

// One curve for every arrival: fast out, long settle.
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
// A little overshoot for things that pop, the game's bouncy feel.
export const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
