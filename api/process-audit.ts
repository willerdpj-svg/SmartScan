import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rmcoiavpsddbcvthmtoi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

interface DetectedProduct {
  brand: string;
  product_name: string;
  size_variant: string | null;
  catalog_match_id: number | null;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  shelf_position: string;
  facing_count: number;
  is_unilever: boolean;
  notes: string | null;
}

interface VisionResponse {
  shelf_section: string;
  image_quality: string;
  products_detected: DetectedProduct[];
  analysis_notes: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey || !anthropicApiKey) {
    return res.status(500).json({
      message: `Missing env vars: ${!supabaseUrl ? 'VITE_SUPABASE_URL ' : ''}${!supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY ' : ''}${!anthropicApiKey ? 'ANTHROPIC_API_KEY' : ''}`.trim()
    });
  }

  try {
    // Auth
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid token' });

    const { audit_id } = req.body;
    if (!audit_id) return res.status(400).json({ message: 'audit_id required' });

    // Update audit status
    await supabase.from('audits').update({ status: 'processing' }).eq('id', audit_id);

    // Get audit and images
    const { data: audit } = await supabase
      .from('audits')
      .select('*')
      .eq('id', audit_id)
      .single();
    if (!audit) return res.status(404).json({ message: 'Audit not found' });

    const { data: auditImages } = await supabase
      .from('audit_images')
      .select('*')
      .eq('audit_id', audit_id)
      .eq('analysis_status', 'pending');

    if (!auditImages?.length) {
      return res.status(400).json({ message: 'No pending images to analyze' });
    }

    // Get product catalog for context
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, size_variant, brand_id, brands(name, category)')
      .eq('is_active', true);

    // Get store planogram
    const { data: planogram } = await supabase
      .from('store_planograms')
      .select('product_id')
      .eq('store_id', audit.store_id);

    const planogramProductIds = new Set(planogram?.map((p: { product_id: number }) => p.product_id));

    // Build catalog context for prompt
    const catalogContext = products?.map((p) => ({
      id: p.id,
      name: p.name,
      brand: (p.brands as { name: string })?.name,
      size: p.size_variant,
    })) || [];

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const allDetections: DetectedProduct[] = [];

    // Process each image
    for (const image of auditImages) {
      try {
        await supabase
          .from('audit_images')
          .update({ analysis_status: 'processing' })
          .eq('id', image.id);

        // Download image from storage
        const { data: imageBlob, error: downloadError } = await supabase
          .storage
          .from('audit-images')
          .download(image.image_url);

        if (downloadError || !imageBlob) {
          throw new Error(`Failed to download image: ${downloadError?.message}`);
        }

        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        const base64Image = buffer.toString('base64');

        // Determine media type
        const ext = image.image_url.split('.').pop()?.toLowerCase();
        const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg';

        // Call Claude Vision
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Image },
              },
              {
                type: 'text',
                text: buildPrompt(catalogContext),
              },
            ],
          }],
        });

        // Parse response
        const textContent = response.content.find((c) => c.type === 'text');
        const responseText = textContent?.type === 'text' ? textContent.text : '';

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');

        const visionResult: VisionResponse = JSON.parse(jsonMatch[0]);

        // Store raw response
        await supabase
          .from('audit_images')
          .update({
            analysis_status: 'completed',
            analysis_raw_json: visionResult,
            processed_at: new Date().toISOString(),
          })
          .eq('id', image.id);

        // Process detected products
        for (const detected of visionResult.products_detected) {
          if (!detected.is_unilever) continue;

          const matchedProduct = matchToCatalog(detected, products || []);

          allDetections.push(detected);

          await supabase.from('audit_findings').insert({
            audit_id,
            audit_image_id: image.id,
            product_id: matchedProduct?.id || null,
            brand_id: matchedProduct?.brand_id || null,
            status: matchedProduct ? 'found' : 'unmatched',
            confidence_score: detected.confidence_score,
            detected_label: detected.product_name,
            detected_brand: detected.brand,
            shelf_position: detected.shelf_position,
            facing_count: detected.facing_count,
            notes: detected.notes,
          });
        }
      } catch (imgError) {
        console.error(`Error processing image ${image.id}:`, imgError);
        await supabase
          .from('audit_images')
          .update({
            analysis_status: 'failed',
            analysis_error: imgError instanceof Error ? imgError.message : 'Unknown error',
          })
          .eq('id', image.id);
      }
    }

    // Determine missing products (in planogram but not found)
    const foundProductIds = new Set(
      allDetections
        .map((d) => matchToCatalog(d, products || [])?.id)
        .filter(Boolean)
    );

    for (const productId of planogramProductIds) {
      if (!foundProductIds.has(productId)) {
        const product = products?.find((p) => p.id === productId);
        await supabase.from('audit_findings').insert({
          audit_id,
          product_id: productId,
          brand_id: product?.brand_id || null,
          status: 'missing',
          confidence_score: 1.0,
          detected_label: product?.name || null,
          detected_brand: (product?.brands as { name: string })?.name || null,
        });
      }
    }

    // Complete audit
    await supabase
      .from('audits')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', audit_id);

    // Return summary
    const totalExpected = planogramProductIds.size;
    const totalFound = foundProductIds.size;
    const totalMissing = totalExpected - totalFound;
    const totalUnmatched = allDetections.filter(
      (d) => !matchToCatalog(d, products || [])
    ).length;

    return res.status(200).json({
      total_expected: totalExpected,
      total_found: totalFound,
      total_missing: totalMissing,
      total_unmatched: totalUnmatched,
      compliance_pct: totalExpected > 0 ? Math.round((totalFound / totalExpected) * 100) : 0,
    });
  } catch (error) {
    console.error('Process audit error:', error);

    // Try to mark audit as failed
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      if (req.body?.audit_id) {
        await supabase
          .from('audits')
          .update({ status: 'failed' })
          .eq('id', req.body.audit_id);
      }
    } catch { /* ignore cleanup errors */ }

    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

function buildPrompt(catalog: { id: number; name: string; brand: string; size: string | null }[]) {
  const catalogList = catalog
    .map((p) => `  - [ID:${p.id}] ${p.brand} "${p.name}"${p.size ? ` (${p.size})` : ''}`)
    .join('\n');

  return `You are a product shelf analysis expert for Unilever South Africa. Analyze this shelf photograph and identify all visible Unilever products.

CONTEXT: You are analyzing a retail store shelf in South Africa. Unilever brands to look for:
- Food: Knorr, Knorrox, Rajah, Robertsons
- Personal Care: Axe, Pepsodent, Rexona, TRESemmé, Vaseline
- Home Care: Comfort, Domestos, Handy Andy, OMO, Sunlight, Surf
- Beauty: Dove

KNOWN PRODUCT CATALOG (match detected items to these where possible):
${catalogList || '  (No products in catalog yet - identify what you see)'}

INSTRUCTIONS:
1. Examine the entire shelf image carefully
2. For each Unilever product you can identify:
   - Read the brand name from the packaging
   - Read the product variant/description text
   - Read the size/weight if visible
   - Note the approximate shelf position (top/middle/bottom, left/center/right)
   - Count visible facings (how many of the same product side-by-side)
   - Estimate your confidence (high/medium/low)
3. Also note any non-Unilever competitor products if clearly visible
4. If packaging is partially obscured, still attempt identification with lower confidence

Respond ONLY with valid JSON in this exact structure:
{
  "shelf_section": "description of what section this appears to be",
  "image_quality": "good" | "fair" | "poor",
  "products_detected": [
    {
      "brand": "exact brand name",
      "product_name": "full product name as read from packaging",
      "size_variant": "size if visible, null otherwise",
      "catalog_match_id": number or null,
      "confidence": "high" | "medium" | "low",
      "confidence_score": 0.0-1.0,
      "shelf_position": "top-left" | "top-center" | "top-right" | "middle-left" | "middle-center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right",
      "facing_count": number,
      "is_unilever": true | false,
      "notes": "any relevant observation"
    }
  ],
  "analysis_notes": "overall observations about shelf condition"
}`;
}

function matchToCatalog(
  detected: DetectedProduct,
  catalog: { id: number; name: string; brand_id: number; size_variant: string | null; brands: unknown }[]
): { id: number; brand_id: number } | null {
  // If Claude already matched to a catalog ID, verify it
  if (detected.catalog_match_id) {
    const match = catalog.find((p) => p.id === detected.catalog_match_id);
    if (match) return { id: match.id, brand_id: match.brand_id };
  }

  // Fuzzy match on brand + product name
  const detectedName = (detected.product_name || '').toLowerCase().trim();
  const detectedBrand = (detected.brand || '').toLowerCase().trim();

  let bestMatch: { id: number; brand_id: number } | null = null;
  let bestScore = 0;

  for (const product of catalog) {
    const brandName = ((product.brands as { name: string })?.name || '').toLowerCase();
    const productName = product.name.toLowerCase();

    let score = 0;

    // Brand match
    if (brandName && detectedBrand.includes(brandName)) score += 0.4;
    else if (brandName && brandName.includes(detectedBrand)) score += 0.3;

    // Product name similarity
    if (productName.includes(detectedName) || detectedName.includes(productName)) {
      score += 0.4;
    } else {
      // Check word overlap
      const detectedWords = detectedName.split(/\s+/);
      const productWords = productName.split(/\s+/);
      const overlap = detectedWords.filter((w) => productWords.some((pw) => pw.includes(w) || w.includes(pw)));
      if (overlap.length > 0) {
        score += 0.2 * (overlap.length / Math.max(detectedWords.length, 1));
      }
    }

    // Size match
    if (detected.size_variant && product.size_variant) {
      const detSize = detected.size_variant.toLowerCase().replace(/\s/g, '');
      const catSize = product.size_variant.toLowerCase().replace(/\s/g, '');
      if (detSize === catSize) score += 0.2;
    }

    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = { id: product.id, brand_id: product.brand_id };
    }
  }

  return bestMatch;
}
