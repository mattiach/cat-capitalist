/**
 * A slimmer Phaser for production builds, aliased to `phaser` in vite.config.ts.
 *
 * It is node_modules/phaser/src/phaser.js without the namespaces this game
 * never touches: Physics (Arcade and Matter), Tilemaps and Sound (the game sets
 * `audio.noAudio` and plays music through an <audio> element). The renderer and
 * plugin flags are set with `define` in vite.config.ts. `phaser-src` points at
 * node_modules/phaser/src. Types still come from the package as usual.
 *
 * If the game starts using one of the dropped namespaces, add it back here.
 */
import 'phaser-src/polyfills/requestVideoFrame.js';
import Actions from 'phaser-src/actions/index.js';
import Animations from 'phaser-src/animations/index.js';
import CONST from 'phaser-src/const.js';
import Cache from 'phaser-src/cache/index.js';
import Cameras from 'phaser-src/cameras/index.js';
import Core from 'phaser-src/core/index.js';
import Game from 'phaser-src/core/Game.js';
import Curves from 'phaser-src/curves/index.js';
import Data from 'phaser-src/data/index.js';
import Display from 'phaser-src/display/index.js';
import DOM from 'phaser-src/dom/index.js';
import Events from 'phaser-src/events/index.js';
import Filters from 'phaser-src/filters/index.js';
import GameObjects from 'phaser-src/gameobjects/index.js';
import Geom from 'phaser-src/geom/index.js';
import Input from 'phaser-src/input/index.js';
import Loader from 'phaser-src/loader/index.js';
import PhaserMath from 'phaser-src/math/index.js';
import Plugins from 'phaser-src/plugins/index.js';
import BlendModes from 'phaser-src/renderer/BlendModes.js';
import Renderer from 'phaser-src/renderer/index.js';
import ScaleModes from 'phaser-src/renderer/ScaleModes.js';
import TintModes from 'phaser-src/renderer/TintModes.js';
import Scale from 'phaser-src/scale/index.js';
import Scenes from 'phaser-src/scene/index.js';
import Scene from 'phaser-src/scene/Scene.js';
import Structs from 'phaser-src/structs/index.js';
import Textures from 'phaser-src/textures/index.js';
import Time from 'phaser-src/time/index.js';
import Tweens from 'phaser-src/tweens/index.js';
import Class from 'phaser-src/utils/Class.js';
import Utils from 'phaser-src/utils/index.js';
import Extend from 'phaser-src/utils/object/Extend.js';

const Phaser = Extend(
  false,
  {
    Actions, Animations, BlendModes, Cache, Cameras, Core, Class, Curves, Data, Display, DOM,
    Events, Filters, Game, GameObjects, Geom, Input, Loader, Math: PhaserMath, Plugins,
    Renderer, Scale, ScaleModes, Scene, Scenes, Structs, Textures, Time, TintModes, Tweens, Utils,
  },
  CONST,
);

globalThis.Phaser = Phaser;

export default Phaser;
