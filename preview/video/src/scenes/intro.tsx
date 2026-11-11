import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/backdrop";
import { Drift } from "../components/drift";
import { Logo } from "../components/logo";
import { Reveal } from "../components/reveal";
import { copy } from "../copy";
import { colors, font } from "../theme";
import { onBeat, scenes } from "../timeline";

export const Intro = () => (
  <Backdrop>
    <Drift duration={scenes.intro} from={1} to={1.04}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          gap: 56,
          justifyContent: "center",
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        <Logo size={200} />
        <Reveal delay={onBeat(2)}>
          <p
            style={{
              color: colors.muted,
              fontFamily: font,
              fontSize: 40,
              margin: 0,
              textWrap: "balance",
            }}
          >
            {copy.intro.tagline}
          </p>
        </Reveal>
      </AbsoluteFill>
    </Drift>
  </Backdrop>
);
