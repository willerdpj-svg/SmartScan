import { useNavigate } from 'react-router-dom';
import { useAudits } from '../hooks/useAudits';
import { AUDIT_STATUS_COLORS, AUDIT_STATUS_LABELS } from '../lib/constants';
import { Camera, ClipboardList, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import clsx from 'clsx';

export default function AuditsListPage() {
  const navigate = useNavigate();
  const { data: audits, isLoading } = useAudits();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
        <button
          onClick={() => navigate('/audits/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Camera className="w-4 h-4" />
          New Audit
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      )}

      {audits && audits.length > 0 ? (
        <div className="space-y-3">
          {audits.map((audit) => {
            const store = audit.store as { name: string; chain: { name: string } } | null;
            const prof = audit.profile as { full_name: string } | null;
            const StatusIcon = audit.status === 'completed' ? CheckCircle2
              : audit.status === 'failed' ? AlertTriangle
              : Clock;
            const iconColor = audit.status === 'completed' ? 'text-green-500'
              : audit.status === 'failed' ? 'text-red-500'
              : 'text-yellow-500';

            return (
              <div
                key={audit.id}
                onClick={() => navigate(`/audits/${audit.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <StatusIcon className={clsx('w-5 h-5', iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {store?.chain?.name} - {store?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {prof?.full_name} &middot;{' '}
                      {new Date(audit.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full', AUDIT_STATUS_COLORS[audit.status])}>
                    {AUDIT_STATUS_LABELS[audit.status]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3" />
          <p className="text-base">No audits yet</p>
          <p className="text-sm mt-1">Start your first shelf scan to see results here</p>
        </div>
      ) : null}
    </div>
  );
}
