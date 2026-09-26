import { useRef } from 'react'
import TerrainCanvas from './scene/TerrainCanvas'

export default function App() {
  const progress = useRef(1)
  return (
    <div className="h-dvh">
      <TerrainCanvas progress={progress} reduced={false} />
    </div>
  )
}
