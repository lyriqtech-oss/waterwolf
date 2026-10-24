import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserShell } from './components/BrowserShell';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserShell/></React.StrictMode>);
