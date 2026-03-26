import { useParams, useNavigate } from 'react-router-dom';
import { useAudit, useAuditImages, useAuditFindings } from '../hooks/useAudits';
import type { AuditFinding } from '../types';
import { AUDIT_STATUS_COLORS, AUDIT_STATUS_LABELS, FINDING_STATUS_COLORS, CONFIDENCE_COLORS } from '../lib/constants';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Package,
  MapPin,
  Clock,
  BarChart3,
} from 'lucide-react';
import clsx from 'clsx';

export default function AuditResultsPage() {
  const { id } = useParams();
  const auditId = Number(id);
  const navigate = useNavigate();
  const { data: audit, isLoading } = useAudit(auditId);
  const { data: images } = useAuditImages(auditId);
  const { data: findings } = useAuditFindings(auditId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!audit) return <div className="text-center py-12 text-gray-500">Audit not found</div>;

  const store = audit.store as { name: string; chain: { name: string } } | null;
  const profile = audit.profile as { full_name: string } | null;

  const foundProducts = findings?.filter((f) => f.status === 'found') || [];
  const missingProducts = findings?.filter((f) => f.status === 'missing') || [];
  const unmatchedProducts = findings?.filter((f) => f.status === 'unmatched') || [];

  const totalExpected = foundProducts.length + missingProducts.length;
  const compliancePct = totalExpected > 0 ? Math.round((foundProducts.length / totalExpected) * 100) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/audits')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Audits
      </button>

      {/* Audit header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {store?.chain?.name} - {store?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(audit.created_at).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
              {profile && <span>by {profile.full_name}</span>}
              {audit.gps_lat && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  GPS captured
                </span>
              )}
            </div>
          </div>
          <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full', AUDIT_STATUS_COLORS[audit.status])}>
            {AUDIT_STATUS_LABELS[audit.status]}
          </span>
        </div>
      </div>

      {/* Compliance summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-primary-500">{compliancePct}%</div>
          <p className="text-xs text-gray-500 mt-1">Compliance</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{foundProducts.length}</div>
          <p className="text-xs text-gray-500 mt-1">Found</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-red-500">{missingProducts.length}</div>
          <p className="text-xs text-gray-500 mt-1">Missing</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-400">{unmatchedProducts.length}</div>
          <p className="text-xs text-gray-500 mt-1">Unmatched</p>
        </div>
      </div>

      {/* Shelf images */}
      {images && images.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Shelf Photos ({images.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => {
              const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/audit-images/${img.image_url}`;
              return (
                <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={publicUrl}
                    alt="Shelf"
                    className="w-full h-full object-cover"
                  />
                  <span className={clsx(
                    'absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium',
                    img.analysis_status === 'completed' ? 'bg-green-500 text-white' :
                    img.analysis_status === 'failed' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                  )}>
                    {img.analysis_status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Found products */}
      {foundProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-green-700 mb-3">
            <CheckCircle2 className="w-5 h-5" />
            Found on Shelf ({foundProducts.length})
          </h2>
          <div className="space-y-2">
            {foundProducts.map((f) => (
              <FindingRow key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {/* Missing products */}
      {missingProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-red-700 mb-3">
            <XCircle className="w-5 h-5" />
            Missing from Shelf ({missingProducts.length})
          </h2>
          <div className="space-y-2">
            {missingProducts.map((f) => (
              <FindingRow key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {/* Unmatched detections */}
      {unmatchedProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-600 mb-3">
            <HelpCircle className="w-5 h-5" />
            Unmatched Detections ({unmatchedProducts.length})
          </h2>
          <p className="text-xs text-gray-400 mb-3">Products detected but not in catalog</p>
          <div className="space-y-2">
            {unmatchedProducts.map((f) => (
              <FindingRow key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {!findings?.length && audit.status === 'completed' && (
        <div className="text-center py-8 text-gray-400">
          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No findings recorded for this audit</p>
        </div>
      )}
    </div>
  );
}

function FindingRow({ finding }: { finding: AuditFinding }) {
  const confidence = finding.confidence_score;
  const confidenceLabel = confidence ? (confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low') : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <Package className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {finding.product?.name || finding.detected_label || 'Unknown product'}
        </p>
        <p className="text-xs text-gray-500">
          {finding.product?.brand?.name || finding.detected_brand || ''}
          {finding.shelf_position && ` · ${finding.shelf_position}`}
          {finding.facing_count > 1 && ` · ${finding.facing_count} facings`}
        </p>
      </div>
      {confidenceLabel && (
        <span className={clsx('text-xs font-medium', CONFIDENCE_COLORS[confidenceLabel])}>
          {Math.round((confidence || 0) * 100)}%
        </span>
      )}
      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', FINDING_STATUS_COLORS[finding.status])}>
        {finding.status}
      </span>
    </div>
  );
}
