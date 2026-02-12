import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress MetaMask auto-connect errors
window.addEventListener('unhandledrejection', (event) => {
  // Check if error is from MetaMask auto-connect
  if (event.reason?.message?.includes('MetaMask') || 
      event.reason?.message?.includes('extension not found')) {
    console.debug('MetaMask auto-connect prevented:', event.reason?.message);
    event.preventDefault(); // Prevent the error from showing in console
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
