import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ChatWorkspace from './ChatWorkspace.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChatWorkspace />
  </StrictMode>,
)
