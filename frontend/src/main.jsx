import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { reloadForFreshBuild } from './utils/lazyWithRetry'

// Vite raises this when a page file from an older deploy can no longer be fetched.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForFreshBuild()) event.preventDefault();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
