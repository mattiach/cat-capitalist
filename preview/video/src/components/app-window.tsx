import { useState } from "react";
import { continueRender, delayRender, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, colors, ease } from "../theme";

// Crops are measured on the game's 16:9 stage. A capture of any size works: like
// `object-fit: cover`, only its centred 16:9 part is used, so the black bars of a
// wider or taller screen never show.
const SHOT_W = 16;
const SHOT_H = 9;

/** Part of the game's 16:9 stage to show, in percent: x, y, width, height. */
export type Crop = readonly [x: number, y: number, w: number, h: number];

interface Props {
  readonly crop: Crop;
  /** Largest box the window may fill; it keeps the crop's shape inside. */
  readonly box: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  /** File in public/screenshots. */
  readonly shot: string;
}

/**
 * A crisp, flat crop of a real screenshot in a rounded window. It rises in,
 * then holds still, so the game's UI stays sharp and readable.
 */
export const AppWindow = ({ shot, crop, box }: Props) => {
  const frame = useCurrentFrame();
  const [size, setSize] = useState<{ w: number; h: number }>();
  const [handle] = useState(() => delayRender(`Measuring ${shot}`));
  const [cx, cy, cw, ch] = crop;
  const ratio = (cw * SHOT_W) / (ch * SHOT_H);
  const width = Math.min(box.width, box.height * ratio);
  const height = width / ratio;

  const enter = interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: ease });

  // The 16:9 stage inside the capture, in percent of the capture.
  const aspect = size ? (size.w * SHOT_H) / (size.h * SHOT_W) : 1;
  const sw = Math.min(100, 100 / aspect);
  const sh = Math.min(100, 100 * aspect);
  const px = { x: (100 - sw) / 2 + (cx * sw) / 100, y: (100 - sh) / 2 + (cy * sh) / 100, w: (cw * sw) / 100, h: (ch * sh) / 100 };

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.edge}`,
        borderRadius: 22,
        boxShadow: "0 30px 80px -10px rgb(0 0 0 / 60%)",
        height,
        left: box.left + (box.width - width) / 2,
        opacity: enter,
        overflow: "hidden",
        position: "absolute",
        scale: 0.96 + 0.04 * enter,
        top: box.top + (box.height - height) / 2,
        translate: `0 ${(1 - enter) * 40}px`,
        width,
      }}
    >
        <Img
          onLoad={(event) => {
            const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
            setSize({ w, h });
            continueRender(handle);
          }}
          src={staticFile(`screenshots/${shot}`)}
          style={{
            height: `${10_000 / px.h}%`,
            left: `${(-px.x / px.w) * 100}%`,
            position: "absolute",
            top: `${(-px.y / px.h) * 100}%`,
            visibility: size ? "visible" : "hidden",
            width: `${10_000 / px.w}%`,
          }}
        />
    </div>
  );
};
