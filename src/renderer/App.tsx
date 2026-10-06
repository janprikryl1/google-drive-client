import { FC, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Files } from '@/pages/Files';

export const App: FC = () => {
  const [tokenReceived, setTokenReceived] = useState<boolean>(false);

  useEffect(() => {
    // Google Implicit Flow returns access_token in the URL fragment (#access_token=ya29...)
    const fullUrl = window.location.href;
    const hashIndex = fullUrl.indexOf('#');
    
    if (hashIndex !== -1) {
      const hashContent = fullUrl.substring(hashIndex + 1);
      if (hashContent.includes('access_token=')) {
        const cleanQuery = hashContent.replace(/^\/?/, '');
        const params = new URLSearchParams(cleanQuery);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          localStorage.setItem('google_access_token', accessToken);
          setTokenReceived(true);
          // Redirect HashRouter cleanly to files page
          window.location.hash = '#/files';
        }
      }
    }
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/files" element={<Files />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to={tokenReceived ? '/files' : '/'} replace />} />
      </Routes>
    </HashRouter>
  );
};
