import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../direction/direction.css'
import CaseApp from './CaseApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode><CaseApp /></StrictMode>,
)
