import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, ClipboardList, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/audits/new', icon: Camera, label: 'Scan' },
  { to: '/audits', icon: ClipboardList, label: 'Audits' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
                isActive ? 'text-primary-500' : 'text-gray-500'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
