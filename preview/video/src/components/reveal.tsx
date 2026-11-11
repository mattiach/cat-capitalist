import type { CSSProperties, ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../theme";

interface Props {
  readonly children: ReactNode;
  readonly delay?: number;
  /** Pixels the block rises while it fades in. */
  readonly distance?: number;
  readonly duration?: number;
  readonly style?: CSSProperties;
}

/** A block that fades and rises into place. */
export const Reveal = ({
  delay = 0,
  duration = 18,
  distance = 20,
  style,
  children,
}: Props) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

  return (
    <div style={{ opacity: p, translate: `0 ${(1 - p) * distance}px`, ...style }}>
      {children}
    </div>
  );
};
