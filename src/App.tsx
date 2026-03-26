import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import StoresPage from './pages/StoresPage';
import StoreDetailPage from './pages/StoreDetailPage';
import AuditsListPage from './pages/AuditsListPage';
import AuditCapturePage from './pages/AuditCapturePage';
import AuditResultsPage from './pages/AuditResultsPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile && profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<AdminRoute><CatalogPage /></AdminRoute>} />
        <Route path="catalog/products/:id" element={<AdminRoute><ProductDetailPage /></AdminRoute>} />
        <Route path="stores" element={<AdminRoute><StoresPage /></AdminRoute>} />
        <Route path="stores/:id" element={<AdminRoute><StoreDetailPage /></AdminRoute>} />
        <Route path="audits" element={<AuditsListPage />} />
        <Route path="audits/new" element={<AuditCapturePage />} />
        <Route path="audits/:id" element={<AuditResultsPage />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
