# Cat Capitalist previews

The preview images are generated from the screenshots in screenshots/ and the HTML pages in src/.

| Screenshot   | Preview        | Main content                              |
| ------------ | -------------- | ----------------------------------------- |
| game.png     | businesses.png | Businesses and their progress bars        |
| managers.png | managers.png   | Manager roster and hiring status          |
| cattery.png  | cattery.png    | Cat portrait, accessories, and collection |
| boutique.png | boutique.png   | Accessories and prices                    |
| victory.png  | victory.png    | Victory screen once everything is owned   |

Run from the Cat Capitalist project root: node preview/scripts/generate-previews.js

This writes the 1920×1080 PNGs to preview/renders/16-9/, one per page in src/16-9/. Set EDGE_PATH if Edge is installed elsewhere.

The promotional film in video/ uses the same screenshots; see [video/README.md](video/README.md).
