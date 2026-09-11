import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ExploreApp } from './ExploreApp.tsx'

createRoot(document.getElementById('explore-root')!).render(
  <StrictMode>
    <ExploreApp />
  </StrictMode>,
)
