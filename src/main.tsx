import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import { GuideRoute } from './routes/GuideRoute'
import { HomeRoute } from './routes/HomeRoute'
import { HostRoute } from './routes/HostRoute'
import { PlayRoute } from './routes/PlayRoute'
import { TvRoute } from './routes/TvRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/guide" element={<GuideRoute />} />
        <Route path="/host" element={<HostRoute />} />
        <Route path="/play" element={<PlayRoute />} />
        <Route path="/tv" element={<TvRoute />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
