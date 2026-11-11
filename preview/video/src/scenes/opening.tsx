import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/backdrop";
import { Drift } from "../components/drift";
import { KineticText } from "../components/kinetic-text";
import { copy } from "../copy";
import { clamp, colors, font, pop } from "../theme";
import { INTRO_HIT, scenes } from "../timeline";

const line = {
  color: colors.ink,
  fontFamily: font,
  fontSize: 92,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  textWrap: "balance",
} as const;

/** The last word pops in orange on the song's first hit. */
const Ambition = ({ text }: { readonly text: string }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [INTRO_HIT, INTRO_HIT + 14], [0, 1], {
    ...clamp,
    easing: pop,
  });

  return (
    <span
      style={{
        color: colors.orange,
        display: "inline-block",
        fontWeight: 700,
        opacity: Math.min(1, p * 3),
        scale: 0.7 + 0.3 * p,
      }}
    >
      {text}
    </span>
  );
};

export const Opening = () => (
  <Backdrop>
    <Drift duration={scenes.opening} from={1} to={1.04}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        <KineticText delay={12} style={line} text={copy.opening.first} />
        <div style={line}>
          <KineticText delay={INTRO_HIT - 22} text={`${copy.opening.second} `} />
          <Ambition text={copy.opening.accent} />
        </div>
      </AbsoluteFill>
    </Drift>
  </Backdrop>
);
