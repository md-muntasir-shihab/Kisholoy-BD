import {StrictMode} from 'react';
import './lib/apiAuth'; // unified token attach + 401 broadcast (security audit Ph.2–4)
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { captureUtmOnVisit } from './utils/utmCapture';

// Marketing Command Center: one-time first-touch UTM capture for order attribution
captureUtmOnVisit();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
