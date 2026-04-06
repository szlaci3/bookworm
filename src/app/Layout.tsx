import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
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
    </div>
  );
}
