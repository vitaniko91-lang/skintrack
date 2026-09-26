import { TerrainStory } from './sections/TerrainStory'
import { PhotoBand } from './sections/PhotoBand'
import { TryIt } from './sections/TryIt'
import { Finale } from './sections/Finale'
import { SiteFooter } from './ui/SiteFooter'

export default function App() {
  return (
    <>
      <main>
        <TerrainStory />
        <PhotoBand />
        <TryIt />
        <Finale />
      </main>
      <SiteFooter />
    </>
  )
}
