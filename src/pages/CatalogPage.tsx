import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrands, useCreateBrand } from '../hooks/useBrands';
import { useProducts, useCreateProduct } from '../hooks/useProducts';
import { BRAND_CATEGORIES, BRAND_CATEGORY_COLORS } from '../lib/constants';
import type { BrandCategory } from '../types';
import { Plus, Package, Search, X, Upload } from 'lucide-react';
import clsx from 'clsx';
import BulkUploadModal from '../components/catalog/BulkUploadModal';

export default function CatalogPage() {
  const navigate = useNavigate();
  const { data: brands } = useBrands();
  const { data: products } = useProducts();
  const createBrand = useCreateBrand();
  const createProduct = useCreateProduct();

  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Brand form
  const [brandName, setBrandName] = useState('');
  const [brandCategory, setBrandCategory] = useState<BrandCategory>('Food');

  // Product form
  const [productName, setProductName] = useState('');
  const [productBrandId, setProductBrandId] = useState<number>(0);
  const [productSku, setProductSku] = useState('');
  const [productSize, setProductSize] = useState('');
  const [productPackaging, setProductPackaging] = useState('');

  const filteredProducts = products?.filter((p) => {
    if (selectedBrand && p.brand_id !== selectedBrand) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBrand.mutateAsync({ name: brandName, category: brandCategory });
    setBrandName('');
    setShowBrandModal(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync({
      brand_id: productBrandId,
      name: productName,
      sku: productSku || undefined,
      size_variant: productSize || undefined,
      packaging_type: productPackaging || undefined,
    });
    setProductName('');
    setProductSku('');
    setProductSize('');
    setProductPackaging('');
    setShowProductModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBrandModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" /> Brand
          </button>
          <button
            onClick={() => {
              if (brands?.length) {
                setProductBrandId(brands[0].id);
                setShowProductModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" /> Product
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
        </div>
      </div>

      {/* Brand filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedBrand(null)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            !selectedBrand ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All ({products?.length || 0})
        </button>
        {brands?.map((brand) => {
          const count = products?.filter((p) => p.brand_id === brand.id).length || 0;
          return (
            <button
              key={brand.id}
              onClick={() => setSelectedBrand(selectedBrand === brand.id ? null : brand.id)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedBrand === brand.id
                  ? 'bg-primary-500 text-white'
                  : clsx(BRAND_CATEGORY_COLORS[brand.category])
              )}
            >
              {brand.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Products grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts?.map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/catalog/products/${product.id}`)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-3">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.brand?.name}</p>
                {product.size_variant && (
                  <p className="text-xs text-gray-400 mt-0.5">{product.size_variant}</p>
                )}
                {product.brand && (
                  <span className={clsx('inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full', BRAND_CATEGORY_COLORS[product.brand.category])}>
                    {product.brand.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm">No products found</p>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <BulkUploadModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Brand</h2>
              <button onClick={() => setShowBrandModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={brandCategory}
                  onChange={(e) => setBrandCategory(e.target.value as BrandCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {BRAND_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={createBrand.isPending}
                className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {createBrand.isPending ? 'Creating...' : 'Create Brand'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Product</h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={productBrandId}
                  onChange={(e) => setProductBrandId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {brands?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. OMO Auto Washing Powder"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <input
                    value={productSize}
                    onChange={(e) => setProductSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. 2kg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Type</label>
                <select
                  value={productPackaging}
                  onChange={(e) => setProductPackaging(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select...</option>
                  <option value="box">Box</option>
                  <option value="bottle">Bottle</option>
                  <option value="sachet">Sachet</option>
                  <option value="tube">Tube</option>
                  <option value="can">Can</option>
                  <option value="bag">Bag</option>
                  <option value="jar">Jar</option>
                  <option value="tub">Tub</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createProduct.isPending}
                className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {createProduct.isPending ? 'Creating...' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
