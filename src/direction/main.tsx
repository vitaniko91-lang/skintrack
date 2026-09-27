import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './direction.css'
import Direction from './Direction'

createRoot(document.getElementById('root')!).render(
  <StrictMode><Direction /></StrictMode>,
)
