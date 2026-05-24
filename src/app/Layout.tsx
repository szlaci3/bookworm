import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-to-top ${visible ? 'scroll-to-top--visible' : ''}`}
      aria-label="Scroll to top"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        width="20"
        height="20"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  );
}

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header__brand">
          Bookworm Archive
        </div>
        <nav className="app-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Catalog
          </NavLink>
          <NavLink 
            to="/collections" 
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Collections
          </NavLink>
        </nav>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <ScrollToTopButton />
    </div>
  );
}
