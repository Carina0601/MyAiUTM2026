import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import MonitorRun from './MonitorRun.jsx'
import SpeechPage from './SpeechPage.jsx'
import SummaryPage from './SummaryPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<MonitorRun></MonitorRun>}></Route>
        <Route path="/speech" element={<SpeechPage></SpeechPage>}></Route>
        <Route path="/summary" element={<SummaryPage></SummaryPage>}></Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
