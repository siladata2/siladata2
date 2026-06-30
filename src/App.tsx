import { useState, useEffect } from 'react';
import PublicLanding from './components/PublicLanding';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen to browser back/forward buttons
    window.addEventListener('popstate', handleLocationChange);

    // Patch history.pushState to listen to inside-app navigation transitions
    const originalPush = window.history.pushState;
    window.history.pushState = function (...args: [any, string, string?]) {
      const res = originalPush.apply(this, args);
      handleLocationChange();
      return res;
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPush;
    };
  }, []);

  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminPanel />;
  }

  return <PublicLanding />;
}
