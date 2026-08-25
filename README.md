# Ormitus Tetris Typography Generator

This project is a Tetris-style typography generator created for my friend Ori Mor's Experimental Typography Class of 2024. The tool allows users to input a character and generate a Tetris block representation of the character using custom or uploaded fonts.

The project is available at https://isadeh.com/alephBetTetris/

## Features

- Input a character to generate a Tetris-style representation.
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

- Ori Mor ([LinkedIn](https://www.linkedin.com/in/ori-mor-3a751a1a7/) or [Instagram](https://www.instagram.com/ormituss/)( for the original idea and font designs.
- Jordan Scales for the 98.css library. https://github.com/jdan/98.css

## Contact
