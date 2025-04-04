import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './icon-override.css'
import './pomodoro-timer.css'
import './timer-fix.css'
import './section-controls-fix.css'
import './react-icons-fix.css'
import './auth-styles.css'
import './logo-enhancement.css'
import './sections-toolbar-center.css'
import './fullscreen-fix.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
