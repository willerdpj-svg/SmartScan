import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { BRAND_CATEGORY_COLORS } from '../lib/constants';
import { ArrowLeft, Package, Image } from 'lucide-react';
import clsx from 'clsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(Number(id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-12 text-gray-500">Product not found</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/catalog')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-32 h-32 rounded-xl object-cover bg-gray-100"
            />
          ) : (
            <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{product.brand?.name}</p>
            {product.brand && (
              <span className={clsx('inline-block mt-2 text-xs px-2.5 py-1 rounded-full', BRAND_CATEGORY_COLORS[product.brand.category])}>
                {product.brand.category}
              </span>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {product.sku && (
                <div>
                  <p className="text-gray-500">SKU</p>
                  <p className="font-medium text-gray-900">{product.sku}</p>
                </div>
              )}
              {product.size_variant && (
                <div>
                  <p className="text-gray-500">Size</p>
                  <p className="font-medium text-gray-900">{product.size_variant}</p>
                </div>
              )}
              {product.packaging_type && (
                <div>
                  <p className="text-gray-500">Packaging</p>
                  <p className="font-medium text-gray-900 capitalize">{product.packaging_type}</p>
                </div>
              )}
            </div>
            {product.description && (
              <p className="mt-4 text-sm text-gray-600">{product.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Reference Images */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Reference Images</h2>
        {product.reference_images && product.reference_images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.reference_images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.image_url}
                  alt={`${product.name} - ${img.image_type}`}
                  className="w-full aspect-square rounded-lg object-cover bg-gray-100"
                />
                <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded capitalize">
                  {img.image_type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Image className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No reference images uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
