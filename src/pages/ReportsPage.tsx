import { useComplianceByStore, useComplianceByBrand } from '../hooks/useDashboard';
import { useAudits } from '../hooks/useAudits';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const { data: storeCompliance } = useComplianceByStore();
  const { data: brandCompliance } = useComplianceByBrand();
  const { data: audits } = useAudits();

  const handleExportCSV = () => {
    if (!audits) return;
    const headers = ['Date', 'Store', 'Chain', 'Status', 'Auditor'];
    const rows = audits.map((a) => {
      const store = a.store as { name: string; chain: { name: string } } | null;
      const profile = a.profile as { full_name: string } | null;
      return [
        new Date(a.created_at).toISOString(),
        store?.name || '',
        store?.chain?.name || '',
        a.status,
        profile?.full_name || '',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartscan-audits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button
          onClick={handleExportCSV}
          disabled={!audits?.length}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Store compliance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Compliance by Store</h2>
          {storeCompliance && storeCompliance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={storeCompliance}>
                <XAxis dataKey="store_name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="compliance_pct" radius={[4, 4, 0, 0]}>
                  {storeCompliance.map((entry, i) => (
                    <Cell key={i} fill={entry.compliance_pct >= 80 ? '#10b981' : entry.compliance_pct >= 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Brand presence */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Brand Presence</h2>
          {brandCompliance && brandCompliance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandCompliance} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="brand_name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="presence_pct" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Audit summary table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          All Audits ({audits?.length || 0})
        </h2>
        {audits && audits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Store</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Auditor</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => {
                  const store = audit.store as { name: string; chain: { name: string } } | null;
                  const prof = audit.profile as { full_name: string } | null;
                  return (
                    <tr key={audit.id} className="border-b border-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">
                        {new Date(audit.created_at).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="py-2.5 px-3 text-gray-900">
                        {store?.chain?.name} - {store?.name}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{prof?.full_name}</td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize text-gray-600">{audit.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
      <BarChart3 className="w-8 h-8 mb-2" />
      <p className="text-sm">No data yet</p>
    </div>
  );
}
