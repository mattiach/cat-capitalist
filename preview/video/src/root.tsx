import { Composition, Folder } from "remotion";
import { CatCapitalist, sceneComponents } from "./cat-capitalist";
import { FPS, type SceneId, scenes, TOTAL_FRAMES } from "./timeline";

const size = { fps: FPS, height: 1080, width: 1920 } as const;

export const RemotionRoot = () => (
  <>
    <Composition
      component={CatCapitalist}
      durationInFrames={TOTAL_FRAMES}
      id="CatCapitalist"
      {...size}
    />
    {/* Each scene on its own, for working on one without scrubbing the film. */}
    <Folder name="CatCapitalist-Scenes">
      {(Object.keys(scenes) as SceneId[]).map((id) => (
        <Composition
          component={sceneComponents[id]}
          durationInFrames={scenes[id]}
          id={id}
          key={id}
          {...size}
        />
      ))}
    </Folder>
  </>
);
