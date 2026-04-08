import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

// Intercept all fetch requests to inject Sanctum token automatically
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  // Only inject to our API URL
  if (typeof resource === 'string' && resource.startsWith(import.meta.env.VITE_API_URL)) {
    const token = localStorage.getItem('token');
    if (token) {
      config = config || {};
      const headers = new Headers(config.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      // Pass Headers directly or convert depending on fetch syntax, but basic object is safer:
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  const response = await originalFetch(resource, config);
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
