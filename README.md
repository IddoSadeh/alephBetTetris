# Tetris Typography Generator

This general-purpose typography tool turns a letter, word, or phrase into a Tetris-block composition using built-in or uploaded fonts.

The project is available at https://isadeh.com/alephBetTetris/

## Features

- Input a letter, word, or phrase in any writing system.
- Choose from a selection of provided fonts or upload your own.
- Adjust the size and opacity of the Tetris grid.
- Select the colors of Tetris blocks used in the representation.
- Export the generated image in PNG, JPEG, or OBJ format.
- Interactive help screen to guide users.

## Local development

The project is a dependency-free static site. No npm install or build step is required.

From the project directory, start any static file server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Pushes to `main` are deployed through the GitHub Pages workflow. Runtime libraries are pinned in `vendor/` so the published site does not depend on npm or a third-party CDN.

## Technologies Used

- HTML, CSS, JavaScript for the front-end development.
- opentype.js for font loading and processing.
- Three.js for the graphics.
- Custom CSS inspired by the 98.css library for a retro Windows 98 look.

## Acknowledgements

- Created by [Iddo Sadeh](https://isadeh.com/) and [Ori Mor](https://www.ormitus.com/).
- Jordan Scales for the 98.css library. https://github.com/jdan/98.css

## Contact
