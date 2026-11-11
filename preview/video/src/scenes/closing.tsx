import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/backdrop";
import { Drift } from "../components/drift";
import { KineticText } from "../components/kinetic-text";
import { Logo } from "../components/logo";
import { Reveal } from "../components/reveal";
import { copy } from "../copy";
import { clamp, colors, easeInOut, font } from "../theme";
import { onBeat, scenes } from "../timeline";

const FADE_OUT = 30;

const Content = () => {
  const frame = useCurrentFrame();
  const out = interpolate(
    frame,
    [scenes.closing - FADE_OUT, scenes.closing],
    [1, 0],
    { ...clamp, easing: easeInOut }
  );

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        fontFamily: font,
        gap: 52,
        justifyContent: "center",
        opacity: out,
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <Logo size={170} />
      <KineticText
        delay={onBeat(2)}
        style={{
          color: colors.ink,
          fontSize: 64,
          fontWeight: 600,
          textWrap: "balance",
        }}
        text={copy.closing.tagline}
      />
      <Reveal delay={onBeat(4)}>
        <p style={{ color: colors.gold, fontSize: 36, fontWeight: 500, margin: 0 }}>
          {copy.closing.platforms}
        </p>
      </Reveal>
    </AbsoluteFill>
  );
};

export const Closing = () => (
  <Backdrop>
    <Drift duration={scenes.closing} from={1.03} to={1}>
      <Content />
    </Drift>
  </Backdrop>
);
