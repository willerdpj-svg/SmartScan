import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useStorePlanogram, useRemoveFromPlanogram, useBulkAddToPlanogram } from '../hooks/useStores';
import { useProducts } from '../hooks/useProducts';
import { ArrowLeft, Store, MapPin, Package, Plus, Trash2, X, Check } from 'lucide-react';
import { BRAND_CATEGORY_COLORS } from '../lib/constants';
import clsx from 'clsx';

export default function StoreDetailPage() {
  const { id } = useParams();
  const storeId = Number(id);
  const navigate = useNavigate();
  const { data: store, isLoading } = useStore(storeId);
  const { data: planogram } = useStorePlanogram(storeId);
  const { data: allProducts } = useProducts();
  const removePlanogram = useRemoveFromPlanogram(storeId);
  const bulkAdd = useBulkAddToPlanogram();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());

  const planogramProductIds = new Set(planogram?.map((p) => p.product_id));
  const availableProducts = allProducts?.filter((p) => !planogramProductIds.has(p.id));

  const toggleProduct = (productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleAddProducts = async () => {
    if (selectedProductIds.size === 0) return;
    await bulkAdd.mutateAsync({ storeId, productIds: Array.from(selectedProductIds) });
    setSelectedProductIds(new Set());
    setShowAddModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!store) return <div className="text-center py-12 text-gray-500">Store not found</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/stores')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Stores
      </button>

      {/* Store info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <Store className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-sm text-gray-500">{store.chain?.name}</p>
            {(store.address || store.city) && (
              <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-2">
                <MapPin className="w-4 h-4" />
                {[store.address, store.city, store.province].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Planogram */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Expected Products (Planogram)
            <span className="ml-2 text-sm font-normal text-gray-400">
              {planogram?.length || 0} products
            </span>
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" /> Add Products
          </button>
        </div>

        {planogram && planogram.length > 0 ? (
          <div className="space-y-2">
            {planogram.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Package className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{entry.product?.name}</p>
                  <p className="text-xs text-gray-500">{entry.product?.brand?.name}</p>
                </div>
                {entry.product?.brand && (
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full', BRAND_CATEGORY_COLORS[entry.product.brand.category])}>
                    {entry.product.brand.category}
                  </span>
                )}
                <button
                  onClick={() => removePlanogram.mutate(entry.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No products assigned. Add products to track on shelves.</p>
          </div>
        )}
      </div>

      {/* Add Products Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Products to Planogram</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {availableProducts?.map((product) => (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    selectedProductIds.has(product.id) ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <div className={clsx(
                    'w-5 h-5 rounded border flex items-center justify-center',
                    selectedProductIds.has(product.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                  )}>
                    {selectedProductIds.has(product.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.brand?.name} {product.size_variant && `· ${product.size_variant}`}</p>
                  </div>
                </div>
              ))}
              {availableProducts?.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">All products are already in the planogram</p>
              )}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={handleAddProducts}
                disabled={selectedProductIds.size === 0 || bulkAdd.isPending}
                className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                Add {selectedProductIds.size} Product{selectedProductIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
