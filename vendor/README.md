# Vendored runtime libraries

These browser modules are committed intentionally so the static site has no package-manager, build-tool, or CDN dependency.

- Three.js `0.165.0`: `three.module.js`, `OrbitControls.js`, and `OBJExporter.js`
- OpenType.js `1.3.4`: `opentype.min.js`

When updating a library, replace its files together, update the version above, test both 2D and 3D exports, and retain the corresponding license file.
