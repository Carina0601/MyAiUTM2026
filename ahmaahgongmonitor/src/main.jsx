import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MonitorRun from './MonitorRun.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MonitorRun />
  </StrictMode>,
)
