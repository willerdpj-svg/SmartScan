import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Store,
  ClipboardList,
  Camera,
  Users,
  BarChart3,
  LogOut,
  X,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';
  const isManagerOrAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary-50 text-primary-500'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    );

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/logo.jpeg" alt="Clicka" className="h-8 object-contain" />
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/" end className={linkClass} onClick={onClose}>
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink to="/audits/new" className={linkClass} onClick={onClose}>
          <Camera className="w-5 h-5" />
          New Audit
        </NavLink>

        <NavLink to="/audits" className={linkClass} onClick={onClose}>
          <ClipboardList className="w-5 h-5" />
          Audit History
        </NavLink>

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            <NavLink to="/catalog" className={linkClass} onClick={onClose}>
              <Package className="w-5 h-5" />
              Product Catalog
            </NavLink>
            <NavLink to="/stores" className={linkClass} onClick={onClose}>
              <Store className="w-5 h-5" />
              Stores
            </NavLink>
            <NavLink to="/users" className={linkClass} onClick={onClose}>
              <Users className="w-5 h-5" />
              Users
            </NavLink>
          </>
        )}

        {isManagerOrAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reports</p>
            </div>
            <NavLink to="/reports" className={linkClass} onClick={onClose}>
              <BarChart3 className="w-5 h-5" />
              Reports
            </NavLink>
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-500">
              {profile?.full_name?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
