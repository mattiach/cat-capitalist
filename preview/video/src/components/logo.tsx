import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, colors, ease, font, pop } from "../theme";
import { KineticText } from "./kinetic-text";

interface Props {
  readonly delay?: number;
  readonly size: number;
}

/** The app icon pops in once, then the name rises out of a mask beside it. */
export const Logo = ({ size, delay = 0 }: Props) => {
  const frame = useCurrentFrame();
  const icon = interpolate(frame, [delay, delay + 16], [0, 1], {
    ...clamp,
    easing: pop,
  });
  const fade = interpolate(frame, [delay, delay + 8], [0, 1], {
    ...clamp,
    easing: ease,
  });

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
        gap: size * 0.26,
      }}
    >
      <Img
        src={staticFile("logo.svg")}
        style={{
          filter: "drop-shadow(0 20px 36px rgb(0 0 0 / 45%))",
          height: size,
          opacity: fade,
          scale: 0.6 + 0.4 * icon,
          width: size,
        }}
      />
      <KineticText
        delay={delay + 8}
        stagger={4}
        style={{
          color: colors.orange,
          fontFamily: font,
          fontSize: size * 0.6,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          whiteSpace: "nowrap",
        }}
        text="Cat Capitalist"
      />
    </div>
  );
};
