import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Backdrop } from "../components/backdrop";
import { KineticText } from "../components/kinetic-text";
import { Reveal } from "../components/reveal";
import { copy } from "../copy";
import { clamp, colors, ease, font } from "../theme";
import { onBeat } from "../timeline";

// One word every two beats, then the rule and the footnote.
const lineAt = (i: number) => onBeat(i * 2);
const RULE_AT = lineAt(copy.heaven.lines.length);

const GoldRule = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [RULE_AT, RULE_AT + 18], [0, 1], {
    ...clamp,
    easing: ease,
  });

  return (
    <div
      style={{
        backgroundColor: colors.gold,
        borderRadius: 2,
        height: 4,
        margin: "48px auto 0",
        width: 220 * p,
      }}
    />
  );
};

/** The game loop in three words, over the businesses blurred far behind. */
export const Heaven = () => (
  <Backdrop tone="deep">
    {/* Oversized so the blurred edges stay off screen. */}
    <AbsoluteFill style={{ scale: 1.1 }}>
      <Img
        src={staticFile("screenshots/game.png")}
        style={{
          filter: "blur(24px)",
          height: "100%",
          objectFit: "cover",
          opacity: 0.22,
          width: "100%",
        }}
      />
    </AbsoluteFill>
    <AbsoluteFill
      style={{
        alignItems: "center",
        fontFamily: font,
        justifyContent: "center",
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      {copy.heaven.lines.map((line, i) => (
        <KineticText
          delay={lineAt(i)}
          key={line}
          style={{
            color: i === copy.heaven.lines.length - 1 ? colors.gold : colors.ink,
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
          text={line}
        />
      ))}
      <GoldRule />
      <Reveal delay={RULE_AT + 6}>
        <p
          style={{
            color: colors.muted,
            fontSize: 34,
            margin: "40px auto 0",
            maxWidth: 1100,
            textWrap: "balance",
          }}
        >
          {copy.heaven.footnote}
        </p>
      </Reveal>
    </AbsoluteFill>
  </Backdrop>
);
