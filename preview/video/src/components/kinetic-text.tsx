import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../theme";

interface Props {
  /** Frame the first word starts arriving. */
  readonly delay?: number;
  /** Frames each word takes to settle. */
  readonly duration?: number;
  /** Frames between consecutive words. */
  readonly stagger?: number;
  readonly style?: CSSProperties;
  readonly text: string;
}

/** Words slide up out of a mask, one after another: crisp, no blur. */
export const KineticText = ({
  text,
  delay = 0,
  stagger = 3,
  duration = 18,
  style,
}: Props) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <span style={{ display: "inline-block", ...style }}>
      {words.map((word, i) => {
        const start = delay + i * stagger;
        const p = interpolate(frame, [start, start + duration], [0, 1], {
          ...clamp,
          easing: ease,
        });
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: words can repeat and never reorder; position is their identity.
            key={`${i}-${word}`}
            style={{
              display: "inline-block",
              // Room for descenders inside the mask.
              marginBottom: "-0.15em",
              overflow: "hidden",
              paddingBottom: "0.15em",
              verticalAlign: "top",
              whiteSpace: "pre",
            }}
          >
            <span
              style={{ display: "inline-block", translate: `0 ${(1 - p) * 110}%` }}
            >
              {word}
              {i < words.length - 1 && " "}
            </span>
          </span>
        );
      })}
    </span>
  );
};
