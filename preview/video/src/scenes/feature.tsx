import { interpolate, useCurrentFrame } from "remotion";
import { AppWindow, type Crop } from "../components/app-window";
import { Backdrop } from "../components/backdrop";
import { KineticText } from "../components/kinetic-text";
import { Reveal } from "../components/reveal";
import { copy } from "../copy";
import { clamp, colors, ease, font } from "../theme";
import { onBeat } from "../timeline";

/** The game's main panel: everything right of the sidebar. */
const PANEL: Crop = [15.6, 0, 84.4, 100];

// One entry per feature scene: the screenshot and its crop (percent of the game's 16:9 stage).
// The victory card covers the sidebar too, so it gets its own centred crop.
export const shots = {
  businesses: { shot: "game.png", crop: PANEL },
  managers: { shot: "managers.png", crop: PANEL },
  cattery: { shot: "cattery.png", crop: PANEL },
  boutique: { shot: "boutique.png", crop: PANEL },
  victory: { shot: "victory.png", crop: [10, 6, 80, 84] },
} as const satisfies Record<string, { shot: string; crop: Crop }>;

export type FeatureId = keyof typeof shots;

const Eyebrow = ({ text, size }: { readonly text: string; readonly size: number }) => {
  const frame = useCurrentFrame();
  const rule = interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: ease });

  return (
    <div
      style={{
        alignItems: "center",
        color: colors.gold,
        display: "flex",
        fontSize: size,
        fontWeight: 700,
        gap: 16,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{ backgroundColor: colors.gold, borderRadius: 2, height: 4, width: 44 * rule }}
      />
      {text}
    </div>
  );
};

// Words left, game right.
const LAYOUT = {
  body: 32,
  eyebrow: 22,
  text: { left: 110, top: 0, width: 500, height: 1080 },
  title: 88,
  window: { left: 680, top: 90, width: 1140, height: 900 },
} as const;

export const Feature = ({ id }: { readonly id: FeatureId }) => {
  const { eyebrow, title, body } = copy[id];

  return (
    <Backdrop>
      <AppWindow
        box={LAYOUT.window}
        crop={shots[id].crop}
        shot={shots[id].shot}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: font,
          justifyContent: "center",
          position: "absolute",
          ...LAYOUT.text,
        }}
      >
        <Reveal distance={10}>
          <Eyebrow size={LAYOUT.eyebrow} text={eyebrow} />
        </Reveal>
        <KineticText
          delay={4}
          style={{
            color: colors.orange,
            fontSize: LAYOUT.title,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            marginTop: 22,
          }}
          text={title}
        />
        <Reveal delay={onBeat(1)}>
          <p
            style={{
              color: colors.muted,
              fontSize: LAYOUT.body,
              lineHeight: 1.45,
              margin: "28px 0 0",
              textWrap: "pretty",
            }}
          >
            {body}
          </p>
        </Reveal>
      </div>
    </Backdrop>
  );
};
