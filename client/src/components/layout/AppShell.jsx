import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./SidebarPanel.jsx";
import Topbar from "./WorkspaceTopbar.jsx";

export default function AppShell({ children }) {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div
        className={`sidebar-backdrop ${navOpen ? "sidebar-backdrop--visible" : ""}`}
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />
      <div className="app-shell__main">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main className="app-shell__content">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
