import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../direction/direction.css'
import CaseApp from './CaseApp'
import { startAnalytics } from '../lib/analytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode><CaseApp /></StrictMode>,
)

void startAnalytics({ key: import.meta.env.VITE_POSTHOG_KEY, enabled: import.meta.env.PROD })
