import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('react-hero-root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
