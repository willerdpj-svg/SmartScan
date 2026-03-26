import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStores, useStoreChains, useCreateStore, useCreateStoreChain } from '../hooks/useStores';
import { SA_PROVINCES } from '../lib/constants';
import { Plus, Store, MapPin, X } from 'lucide-react';

export default function StoresPage() {
  const navigate = useNavigate();
  const { data: stores } = useStores();
  const { data: chains } = useStoreChains();
  const createStore = useCreateStore();
  const createChain = useCreateStoreChain();

  const [showModal, setShowModal] = useState(false);
  const [showChainModal, setShowChainModal] = useState(false);
  const [chainId, setChainId] = useState<number>(0);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [chainName, setChainName] = useState('');

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStore.mutateAsync({
      chain_id: chainId,
      name,
      address: address || undefined,
      city: city || undefined,
      province: province || undefined,
    });
    setName('');
    setAddress('');
    setCity('');
    setProvince('');
    setShowModal(false);
  };

  const handleCreateChain = async (e: React.FormEvent) => {
    e.preventDefault();
    await createChain.mutateAsync({ name: chainName });
    setChainName('');
    setShowChainModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChainModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" /> Chain
          </button>
          <button
            onClick={() => {
              if (chains?.length) {
                setChainId(chains[0].id);
                setShowModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" /> Store
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores?.map((store) => (
          <div
            key={store.id}
            onClick={() => navigate(`/stores/${store.id}`)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{store.name}</p>
                <p className="text-xs text-gray-500">{store.chain?.name}</p>
                {(store.city || store.province) && (
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    {[store.city, store.province].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {stores?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Store className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm">No stores yet. Add your first store.</p>
        </div>
      )}

      {/* Store Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Store</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chain</label>
                <select
                  value={chainId}
                  onChange={(e) => setChainId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {chains?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. Checkers Sandton City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select...</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={createStore.isPending}
                className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {createStore.isPending ? 'Creating...' : 'Create Store'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chain Modal */}
      {showChainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Store Chain</h2>
              <button onClick={() => setShowChainModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateChain} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chain Name</label>
                <input
                  required
                  value={chainName}
                  onChange={(e) => setChainName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. Checkers"
                />
              </div>
              <button
                type="submit"
                disabled={createChain.isPending}
                className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {createChain.isPending ? 'Creating...' : 'Create Chain'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
