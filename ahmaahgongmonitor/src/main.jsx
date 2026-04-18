import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import MonitorRun from './MonitorRun.jsx'
import SpeechPage from './SpeechPage.jsx'
import SummaryPage from './SummaryPage.jsx'
import AmbulanceMonitor from './AmbulanceMonitor.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<MonitorRun></MonitorRun>}></Route>
        <Route path="/ambulance" element={<AmbulanceMonitor></AmbulanceMonitor>}></Route>
        <Route path="/speech/:id" element={<SpeechPage></SpeechPage>}></Route>
        <Route path="/summary/:id" element={<SummaryPage></SummaryPage>}></Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
