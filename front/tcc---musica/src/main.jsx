import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Home from './containers/Home'
import Assistente from './containers/Assistente'
import MyGlobalStyles from './styles/globalStyles'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MyGlobalStyles />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assistente" element={<Assistente />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
