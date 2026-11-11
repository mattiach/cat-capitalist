import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colors } from "../theme";

interface Props {
  readonly children?: ReactNode;
  readonly tone?: "bg" | "deep";
}

/** The game's purple ground, a soft glow top right, a vignette and film grain. */
export const Backdrop = ({ tone = "bg", children }: Props) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(70% 90% at 100% 5%, ${colors.edge}66, transparent 72%), ${colors[tone]}`,
      }}
    >
      {children}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 45%, rgb(0 0 0 / 45%) 100%)",
          pointerEvents: "none",
        }}
      />
      <svg
        aria-hidden="true"
        height="100%"
        style={{
          inset: 0,
          mixBlendMode: "screen",
          opacity: 0.06,
          pointerEvents: "none",
          position: "absolute",
        }}
        width="100%"
      >
        <filter id="grain">
          <feTurbulence
            baseFrequency="0.85"
            numOctaves="2"
            seed={frame % 12}
            stitchTiles="stitch"
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect filter="url(#grain)" height="100%" width="100%" />
      </svg>
    </AbsoluteFill>
  );
};
