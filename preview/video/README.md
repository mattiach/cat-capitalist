# Cat Capitalist promotional video

A ~47 second, 30 fps film made with [Remotion](https://remotion.dev):
`cat-capitalist.mp4` (16:9, 1920×1080), plus `poster.png`. The MP4 is not
committed.

The film is cut to the soundtrack: `src/timeline.ts` measures scenes in beats
of the track (~110 BPM, band in at 5.88 s), cuts straight from scene to scene on a beat,
and times arrivals inside a scene with `onBeat()`. The only sound is the song. If you change the
track, measure those two values again.

From the repository root, one command installs this project's dependencies (on
the first run only) and renders:

```sh
pnpm generate:video
```

Working on the film itself, from this folder:

```sh
pnpm install
pnpm dev         # Remotion Studio: preview and scrub
pnpm render      # writes the film and poster.png
```

This folder is its own pnpm root (`pnpm-workspace.yaml`), separate from the
game's dependencies. `dev` and `render` first run `scripts/copy-assets.mjs`,
which copies the screenshots from `../screenshots/`, the app icon and the
soundtrack from the game into `public/`. Those copies
are not committed.

## Where to change things

| What | Where |
|---|---|
| Every line of on-screen text | `src/copy.ts` |
| Scene order and lengths in beats | `src/timeline.ts` |
| Which screenshot a feature shows, and its crop (percent of the game's 16:9 stage; any capture size works) | `shots` in `src/scenes/feature.tsx` |
| Colours, font, easing | `src/theme.ts` (the game's own palette) |
| Soundtrack | `scripts/copy-assets.mjs` |

Each scene is also registered on its own under *Scenes* in Studio.

## Scenes

1. **Opening**: "It starts with one yarn ball stand. And a lot of ambition."
2. **Logo**: the icon pops in, the name slides out, then the tagline.
3. **Businesses**: `game.png`.
4. **Managers**: `managers.png`.
5. **Cats**: `cattery.png`.
6. **Boutique**: `boutique.png`.
7. **Victory**: `victory.png`, the screen shown once everything is owned.
8. **Cat Heaven**: "Reinvest. Automate. Ascend." over a blurred `game.png`.
9. **Closing**: logo, "Every cat has a business plan.", platforms.

## Licensing

This folder's code is MIT-licensed, like the rest of Cat Capitalist. Fredoka
is under the SIL Open Font License 1.1 (`public/fonts/Fredoka-OFL.txt`). The
music is by [Brotheration Records](https://www.brotheration.com/), the same file
the game uses.

Remotion is not open source. It is distributed under the
[Remotion License](https://www.remotion.dev/license), which is free for
individuals, small companies and non-profits and requires a company licence for
larger for-profit organisations. Check which applies to you before rendering
this video, especially for commercial use.
