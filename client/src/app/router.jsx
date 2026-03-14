import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import CustomersPage from "../pages/CustomersPage.jsx";
import ChargesPage from "../pages/ChargesPage.jsx";
import ChargeDetailPage from "../pages/ChargeDetailPage.jsx";
import TemplatesPage from "../pages/TemplatesPage.jsx";
import DispatchHistoryPage from "../pages/DispatchHistoryPage.jsx";
import IntegrationsPage from "../pages/IntegrationsPage.jsx";

function ProtectedRoute() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <div className="page-center">
        <div className="loading-card">
          <div className="spinner" />
          <p>Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell><Outlet /></AppShell>;
}

function PublicOnlyRoute() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <div className="page-center">
        <div className="loading-card">
          <div className="spinner" />
          <p>Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/charges" element={<ChargesPage />} />
          <Route path="/charges/:id" element={<ChargeDetailPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/dispatches" element={<DispatchHistoryPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
