import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { captureUtmOnVisit } from './utils/utmCapture';
import { installApiAuthInterceptor } from './lib/apiClient';

// Attach session tokens to the legacy raw fetch('/api/...') call sites before
// any component mounts, so server-side RBAC sees an identity.
installApiAuthInterceptor();

// Marketing Command Center: one-time first-touch UTM capture for order attribution
captureUtmOnVisit();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
