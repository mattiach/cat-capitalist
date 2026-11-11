import { Audio } from "@remotion/media";
import type { FC } from "react";
import { AbsoluteFill, interpolate, Series, staticFile } from "remotion";
import { Closing } from "./scenes/closing";
import { Feature, type FeatureId } from "./scenes/feature";
import { Heaven } from "./scenes/heaven";
import { Intro } from "./scenes/intro";
import { Opening } from "./scenes/opening";
import { clamp } from "./theme";
import { type SceneId, scenes, TOTAL_FRAMES } from "./timeline";

const MUSIC_FADE_IN = 15;
const MUSIC_FADE_OUT = 60;

const musicVolume = (f: number) =>
  interpolate(
    f,
    [0, MUSIC_FADE_IN, TOTAL_FRAMES - MUSIC_FADE_OUT, TOTAL_FRAMES],
    [0, 0.9, 0.9, 0],
    clamp
  );

const feature = (id: FeatureId) => () => <Feature id={id} />;

/** Every scene, in film order (the order of `scenes` in timeline.ts). */
export const sceneComponents: Record<SceneId, FC> = {
  opening: Opening,
  intro: Intro,
  businesses: feature("businesses"),
  managers: feature("managers"),
  cattery: feature("cattery"),
  boutique: feature("boutique"),
  victory: feature("victory"),
  heaven: Heaven,
  closing: Closing,
};

/** Straight cuts on the beat; the only sound is the song. */
export const CatCapitalist = () => (
  <AbsoluteFill>
    <Audio src={staticFile("audio/music.mp3")} volume={musicVolume} />
    <Series>
      {(Object.keys(scenes) as SceneId[]).map((id) => {
        const Scene = sceneComponents[id];
        return (
          <Series.Sequence durationInFrames={scenes[id]} key={id} name={id}>
            <Scene />
          </Series.Sequence>
        );
      })}
    </Series>
  </AbsoluteFill>
);
