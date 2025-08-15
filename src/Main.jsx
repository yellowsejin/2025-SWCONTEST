import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './assets/scss/style.scss';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
