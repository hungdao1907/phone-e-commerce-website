import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installFetchInterceptor } from './lib/authFetch';

// Install global 401 handler: any fetch returning 401 (except login itself)
// will automatically clear the stale session and redirect to /login.
installFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
