import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStores } from '../hooks/useStores';
import { useCreateAudit, useUploadAuditImage, useCreateAuditImage, useProcessAudit } from '../hooks/useAudits';
import {
  Camera,
  Upload,
  X,
  Loader2,
  MapPin,
  Store,
  Play,
} from 'lucide-react';

interface CapturedImage {
  file: Blob;
  preview: string;
  name: string;
}

export default function AuditCapturePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stores } = useStores();
  const createAudit = useCreateAudit();
  const uploadImage = useUploadAuditImage();
  const createAuditImage = useCreateAuditImage();
  const processAudit = useProcessAudit();

  const [step, setStep] = useState<'select-store' | 'capture' | 'processing' | 'done'>('select-store');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [, setAuditId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: CapturedImage[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        });
      }
    }
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleStartAudit = async () => {
    if (!selectedStoreId || !user || images.length === 0) return;
    setError('');
    setProcessing(true);
    setStep('processing');

    try {
      // Get GPS if available
      let gps: { lat: number; lng: number } | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        // GPS not available, continue without it
      }

      // Create audit
      setUploadProgress('Creating audit...');
      const audit = await createAudit.mutateAsync({
        user_id: user.id,
        store_id: selectedStoreId,
        gps_lat: gps?.lat,
        gps_lng: gps?.lng,
      });
      setAuditId(audit.id);

      // Upload images
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`Uploading image ${i + 1} of ${images.length}...`);
        const img = images[i];
        const filename = `${Date.now()}-${i}.jpg`;
        const path = await uploadImage.mutateAsync({
          auditId: audit.id,
          file: img.file,
          filename,
        });
        await createAuditImage.mutateAsync({
          audit_id: audit.id,
          image_url: path,
          source_type: 'photo',
        });
      }

      // Process with Claude Vision
      setUploadProgress('Analyzing shelf images with AI...');
      await processAudit.mutateAsync(audit.id);

      setStep('done');
      navigate(`/audits/${audit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process audit');
      setStep('capture');
    } finally {
      setProcessing(false);
    }
  };

  const selectedStore = stores?.find((s) => s.id === selectedStoreId);

  // Step 1: Select Store
  if (step === 'select-store') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">New Shelf Audit</h1>
        <p className="text-sm text-gray-500">Select the store you're auditing</p>

        <div className="space-y-2">
          {stores?.map((store) => (
            <button
              key={store.id}
              onClick={() => {
                setSelectedStoreId(store.id);
                setStep('capture');
              }}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{store.name}</p>
                <p className="text-xs text-gray-500">
                  {store.chain?.name}
                  {store.city && ` · ${store.city}`}
                </p>
              </div>
            </button>
          ))}
        </div>

        {stores?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Store className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm">No stores configured. Ask admin to add stores first.</p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Capture Photos
  if (step === 'capture') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Capture Shelves</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {selectedStore?.chain?.name} - {selectedStore?.name}
            </p>
          </div>
          <button
            onClick={() => setStep('select-store')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Change store
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Capture buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <Camera className="w-8 h-8 text-primary-500" />
            <span className="text-sm font-medium text-gray-700">Take Photo</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <Upload className="w-8 h-8 text-primary-500" />
            <span className="text-sm font-medium text-gray-700">Upload Photos</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Image previews */}
        {images.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              {images.length} photo{images.length !== 1 ? 's' : ''} captured
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img
                    src={img.preview}
                    alt={`Shelf ${idx + 1}`}
                    className="w-full h-full rounded-lg object-cover"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyze button */}
        {images.length > 0 && (
          <button
            onClick={handleStartAudit}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            Analyze {images.length} Photo{images.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    );
  }

  // Step 3: Processing
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
      <h2 className="text-lg font-semibold text-gray-900">Analyzing Shelves</h2>
      <p className="text-sm text-gray-500 mt-2">{uploadProgress}</p>
      <p className="text-xs text-gray-400 mt-4">
        Our AI is identifying Unilever products on the shelves...
      </p>
    </div>
  );
}
