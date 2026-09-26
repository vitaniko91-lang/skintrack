import { TerrainStory } from './sections/TerrainStory'
import { PhotoBand } from './sections/PhotoBand'
import { TryIt } from './sections/TryIt'
import { Finale } from './sections/Finale'

export default function App() {
  return (
    <>
      <main>
        <TerrainStory />
        <PhotoBand />
        <TryIt />
        <Finale />
      </main>
      <footer className="flex flex-col gap-2 px-4 pb-8 pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted lg:flex-row lg:justify-between md:px-10">
        <span className="sm:whitespace-nowrap">skintrack is a concept project by Vitalina Nikulina</span>
        <span className="sm:whitespace-nowrap">Terrain · Mapzen/Tilezen · Photo · Unsplash</span>
      </footer>
    </>
  )
}
