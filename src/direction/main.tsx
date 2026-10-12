import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './direction.css'
import Direction from './Direction'
import { startAnalytics } from '../lib/analytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode><Direction /></StrictMode>,
)

void startAnalytics({ key: import.meta.env.VITE_POSTHOG_KEY, enabled: import.meta.env.PROD })
