/** Подвал: кто сделал, откуда фото и рельеф. */
export function Credits() {
  return (
    <footer className="bg-ground px-[5vw] pb-10 pt-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-muted max-md:px-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3 border-t border-white/10 pt-6">
        <p><span className="wordmark mr-3 text-[18px] normal-case tracking-[-0.055em] text-white">skintrack</span>Concept project by Vitalina Nikulina — not a real app, not avalanche advice</p>
        <p>Photos · Johannes Andersson, Hendrik Morkel / Unsplash</p>
        <p>Terrain · Mapzen / Tilezen (AWS Terrain Tiles)</p>
      </div>
    </footer>
  )
}
