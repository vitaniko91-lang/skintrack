# skintrack

Concept product site for an avalanche-aware ski-touring navigator: route, slope angle and danger level on one map.
Case study: `/case.html`.

- **Terrain** — real elevation (AWS Terrain Tiles, terrarium, z13) around the Matterhorn, decoded in the browser off the main thread.
  One elevation model feeds the faceted chrome mountain, the phone map and the slope layer.
- **Motion** — one glowing skin-track ribbon runs through the page: out of the hero photo, up the 3D mountain, through the phones, into the wordmark. GSAP ScrollTrigger + Lenis.
- **Stack** — Vite, React 19, TypeScript, Tailwind v4, three.js via React Three Fiber, Vitest.
- **Accessibility** — `prefers-reduced-motion` gives static, fully composed frames; safety colours (danger scale, slope bands) never double as the brand cyan.

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

Data scripts (Python with Pillow + numpy): `scripts/build_terrain.py`, `scripts/build_map.py`, `scripts/duotone_cyan.py`.

Photos: Johannes Andersson, Hendrik Morkel / Unsplash. Gear mockups on photos by Imad Clicks, Natalia García Prieto, Özgür Beşli, Atlantic Ambience / Pexels. Terrain: Mapzen/Tilezen.

Concept project by Vitalina Nikulina — not an actual product, not avalanche advice.
