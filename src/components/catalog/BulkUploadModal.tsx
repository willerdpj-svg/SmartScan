import { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface BulkUploadModalProps {
  onClose: () => void;
}

interface ParsedProduct {
  category: string;
  sku: string;
  barcode: string;
  brand: string;
  name: string;
  pack_size: string;
  size_variant: string;
  vat: boolean;
  moq: number;
  unit_price: number | null;
}

type UploadStep = 'supplier' | 'file' | 'preview' | 'uploading' | 'done';

export default function BulkUploadModal({ onClose }: BulkUploadModalProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>('supplier');
  const [supplier, setSupplier] = useState('');
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        const parsed: ParsedProduct[] = rows
          .filter((row) => row['Description'] || row['SKU'])
          .map((row) => ({
            category: String(row['Category'] || '').trim(),
            sku: String(row['SKU'] || '').trim(),
            barcode: String(row['Barcode'] || '').trim(),
            brand: String(row['Brand'] || '').trim(),
            name: String(row['Description'] || '').trim(),
            pack_size: String(row['Pack Size'] || '').trim(),
            size_variant: String(row['Size'] || '').trim(),
            vat: String(row['VAT?'] || '').toLowerCase() === 'yes',
            moq: Number(row['MoQ']) || 1,
            unit_price: row['Unit Price (Excl. VAT)'] ? Number(row['Unit Price (Excl. VAT)']) : null,
          }))
          .filter((p) => p.name && p.brand);

        setProducts(parsed);
        setStep('preview');
      } catch {
        setError('Failed to parse file. Please use the correct Excel format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    setStep('uploading');
    setProgress(0);
    setError('');

    try {
      // Step 1: Delete all existing products and brands for this supplier
      setProgressText('Clearing existing products...');
      await supabase.from('products').delete().eq('supplier', supplier);

      // Step 2: Get or create brands
      setProgressText('Setting up brands...');
      const brandNames = [...new Set(products.map((p) => p.brand).filter(Boolean))];
      const brandMap = new Map<string, number>();

      for (const brandName of brandNames) {
        const { data: existing } = await supabase
          .from('brands')
          .select('id')
          .ilike('name', brandName)
          .single();

        if (existing) {
          brandMap.set(brandName, existing.id);
        } else {
          const { data: created } = await supabase
            .from('brands')
            .insert({ name: brandName, category: 'Personal Care' })
            .select('id')
            .single();
          if (created) brandMap.set(brandName, created.id);
        }
      }

      // Step 3: Batch insert products
      setProgressText('Uploading products...');
      const BATCH = 100;
      for (let i = 0; i < products.length; i += BATCH) {
        const batch = products.slice(i, i + BATCH).map((p) => ({
          name: p.name,
          sku: p.sku || null,
          brand_id: brandMap.get(p.brand) || null,
          size_variant: p.size_variant || null,
          category: p.category || null,
          barcode: p.barcode || null,
          pack_size: p.pack_size || null,
          vat: p.vat,
          moq: p.moq,
          unit_price: p.unit_price,
          supplier: supplier,
          is_active: true,
        }));

        const { error: insertError } = await supabase.from('products').insert(batch);
        if (insertError) throw new Error(insertError.message);

        setProgress(Math.round(((i + BATCH) / products.length) * 100));
        setProgressText(`Uploaded ${Math.min(i + BATCH, products.length)} of ${products.length} products...`);
      }

      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['brands'] });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('preview');
    }
  };

  // Unique brands summary
  const brandSummary = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Bulk Upload Products</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step: Supplier */}
        {step === 'supplier' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Which supplier are you uploading products for?</p>
            <input
              autoFocus
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Unilever"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && supplier.trim() && setStep('file')}
            />
            <button
              onClick={() => setStep('file')}
              disabled={!supplier.trim()}
              className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: File */}
        {step === 'file' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Uploading for: <span className="font-semibold text-gray-900">{supplier}</span>
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Click to select Excel file</p>
              <p className="text-xs text-gray-400 mt-1">Columns: Category, SKU, Barcode, Brand, Description, Pack Size, Size, VAT?, MoQ, Unit Price</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <button onClick={() => setStep('supplier')} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </button>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 text-sm rounded-lg">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Parsed <strong>{products.length} products</strong> for <strong>{supplier}</strong>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(brandSummary).map(([brand, count]) => (
                <div key={brand} className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">{brand}</span>
                  <span className="text-gray-400">{count} products</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
              ⚠ This will <strong>replace all existing {supplier} products</strong> in the catalog.
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep('file')} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                ← Back
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
              >
                Upload {products.length} Products
              </button>
            </div>
          </div>
        )}

        {/* Step: Uploading */}
        {step === 'uploading' && (
          <div className="space-y-4 py-4 text-center">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-700">{progressText}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{progress}%</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-semibold text-gray-900">Upload Complete!</p>
            <p className="text-sm text-gray-500">
              Successfully uploaded <strong>{products.length} products</strong> for <strong>{supplier}</strong>.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
