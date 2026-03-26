import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, useRecentAudits, useComplianceByStore, useComplianceByBrand } from '../hooks/useDashboard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  ClipboardList,
  Store,
  Package,
  Camera,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { AUDIT_STATUS_COLORS, AUDIT_STATUS_LABELS } from '../lib/constants';
import clsx from 'clsx';

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: recentAudits } = useRecentAudits(5);
  const { data: storeCompliance } = useComplianceByStore();
  const { data: brandCompliance } = useComplianceByBrand();

  const statCards = [
    { label: 'Total Audits', value: stats?.total_audits || 0, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Stores', value: stats?.total_stores || 0, icon: Store, color: 'text-green-600 bg-green-50' },
    { label: 'Products', value: stats?.total_products || 0, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Brands', value: stats?.total_brands || 0, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Shelf compliance overview</p>
        </div>
        <button
          onClick={() => navigate('/audits/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Camera className="w-4 h-4" />
          New Audit
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Store Compliance Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Store Compliance</h2>
          {storeCompliance && storeCompliance.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={storeCompliance} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="store_name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="compliance_pct" radius={[0, 4, 4, 0]}>
                  {storeCompliance.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.compliance_pct >= 80 ? '#10b981' : entry.compliance_pct >= 50 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Store className="w-8 h-8 mb-2" />
              <p className="text-sm">No audit data yet</p>
            </div>
          )}
        </div>

        {/* Brand Presence Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Brand Presence</h2>
          {brandCompliance && brandCompliance.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={brandCompliance} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="brand_name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="presence_pct" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-sm">No brand data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Audits</h2>
          <button
            onClick={() => navigate('/audits')}
            className="text-sm text-primary-500 hover:underline"
          >
            View all
          </button>
        </div>
        {recentAudits && recentAudits.length > 0 ? (
          <div className="space-y-3">
            {recentAudits.map((audit) => {
              const store = audit.store as { name: string; chain: { name: string } } | null;
              const prof = audit.profile as { full_name: string } | null;
              return (
                <div
                  key={audit.id}
                  onClick={() => navigate(`/audits/${audit.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    {audit.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : audit.status === 'failed' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {store?.chain?.name} - {store?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {prof?.full_name} &middot; {new Date(audit.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', AUDIT_STATUS_COLORS[audit.status])}>
                    {AUDIT_STATUS_LABELS[audit.status]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <ClipboardList className="w-8 h-8 mb-2" />
            <p className="text-sm">No audits yet. Start your first shelf scan!</p>
          </div>
        )}
      </div>
    </div>
  );
}
