import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Known Unilever SA products scraped from Checkers.co.za and other SA retailers
// This is the seed data - admin can add more via the UI
const SEED_PRODUCTS: { brand: string; products: { name: string; size: string; packaging: string }[] }[] = [
  {
    brand: 'OMO',
    products: [
      { name: 'OMO Auto Washing Powder', size: '2kg', packaging: 'box' },
      { name: 'OMO Auto Washing Powder', size: '3kg', packaging: 'box' },
      { name: 'OMO Auto Washing Powder', size: '5kg', packaging: 'box' },
      { name: 'OMO Auto Washing Liquid', size: '1.5L', packaging: 'bottle' },
      { name: 'OMO Auto Washing Liquid', size: '3L', packaging: 'bottle' },
      { name: 'OMO Hand Washing Powder', size: '2kg', packaging: 'box' },
      { name: 'OMO Hand Washing Powder', size: '3kg', packaging: 'box' },
      { name: 'OMO Auto Power Capsules', size: '16 Pack', packaging: 'box' },
      { name: 'OMO Auto Power Capsules', size: '20 Pack', packaging: 'box' },
      { name: 'OMO Superlift Auto Washing Powder', size: '2kg', packaging: 'box' },
      { name: 'OMO Superlift Auto Washing Powder', size: '3kg', packaging: 'box' },
    ],
  },
  {
    brand: 'Sunlight',
    products: [
      { name: 'Sunlight Dishwashing Liquid Regular', size: '750ml', packaging: 'bottle' },
      { name: 'Sunlight Dishwashing Liquid Lemon', size: '750ml', packaging: 'bottle' },
      { name: 'Sunlight Dishwashing Liquid Regular', size: '400ml', packaging: 'bottle' },
      { name: 'Sunlight 2in1 Hand Washing Powder', size: '2kg', packaging: 'box' },
      { name: 'Sunlight Auto Washing Powder', size: '2kg', packaging: 'box' },
      { name: 'Sunlight Laundry Bar', size: '500g', packaging: 'bar' },
      { name: 'Sunlight Laundry Bar', size: '1kg', packaging: 'bar' },
      { name: 'Sunlight Multipurpose Cream Cleaner', size: '500ml', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Surf',
    products: [
      { name: 'Surf Auto Washing Powder Lavender', size: '2kg', packaging: 'box' },
      { name: 'Surf Auto Washing Powder Lavender', size: '3kg', packaging: 'box' },
      { name: 'Surf Hand Washing Powder', size: '2kg', packaging: 'box' },
      { name: 'Surf Auto Washing Liquid', size: '1.5L', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Comfort',
    products: [
      { name: 'Comfort Fabric Conditioner Lily Fresh', size: '800ml', packaging: 'bottle' },
      { name: 'Comfort Fabric Conditioner Lily Fresh', size: '2L', packaging: 'bottle' },
      { name: 'Comfort Fabric Conditioner Aromatherapy', size: '800ml', packaging: 'bottle' },
      { name: 'Comfort Fabric Conditioner Elegance', size: '800ml', packaging: 'bottle' },
      { name: 'Comfort Fabric Conditioner Pure', size: '800ml', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Domestos',
    products: [
      { name: 'Domestos Thick Bleach Regular', size: '750ml', packaging: 'bottle' },
      { name: 'Domestos Thick Bleach Citrus', size: '750ml', packaging: 'bottle' },
      { name: 'Domestos Thick Bleach Mountain Fresh', size: '750ml', packaging: 'bottle' },
      { name: 'Domestos Toilet Cleaner Regular', size: '500ml', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Handy Andy',
    products: [
      { name: 'Handy Andy Floor Cleaner Lavender', size: '750ml', packaging: 'bottle' },
      { name: 'Handy Andy Floor Cleaner Lemon', size: '750ml', packaging: 'bottle' },
      { name: 'Handy Andy Floor Cleaner Ocean Fresh', size: '750ml', packaging: 'bottle' },
      { name: 'Handy Andy Cream Cleaner Original', size: '500ml', packaging: 'bottle' },
      { name: 'Handy Andy Floor Cleaner Lavender', size: '2L', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Dove',
    products: [
      { name: 'Dove Beauty Bar White', size: '100g', packaging: 'bar' },
      { name: 'Dove Beauty Bar White', size: '4x100g', packaging: 'box' },
      { name: 'Dove Body Wash Deeply Nourishing', size: '250ml', packaging: 'bottle' },
      { name: 'Dove Body Wash Deeply Nourishing', size: '500ml', packaging: 'bottle' },
      { name: 'Dove Shampoo Daily Moisture', size: '400ml', packaging: 'bottle' },
      { name: 'Dove Conditioner Daily Moisture', size: '350ml', packaging: 'bottle' },
      { name: 'Dove Antiperspirant Roll-On Original', size: '50ml', packaging: 'tube' },
      { name: 'Dove Deodorant Spray Original', size: '150ml', packaging: 'can' },
    ],
  },
  {
    brand: 'Vaseline',
    products: [
      { name: 'Vaseline Blue Seal Original', size: '100ml', packaging: 'tub' },
      { name: 'Vaseline Blue Seal Original', size: '250ml', packaging: 'tub' },
      { name: 'Vaseline Body Lotion Essential Healing', size: '400ml', packaging: 'bottle' },
      { name: 'Vaseline Body Lotion Cocoa Radiant', size: '400ml', packaging: 'bottle' },
      { name: 'Vaseline Lip Therapy Original', size: '10g', packaging: 'tube' },
      { name: 'Vaseline Men Body Lotion Extra Strength', size: '400ml', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Axe',
    products: [
      { name: 'Axe Body Spray Africa', size: '150ml', packaging: 'can' },
      { name: 'Axe Body Spray Dark Temptation', size: '150ml', packaging: 'can' },
      { name: 'Axe Body Spray Apollo', size: '150ml', packaging: 'can' },
      { name: 'Axe Shower Gel Africa', size: '250ml', packaging: 'bottle' },
      { name: 'Axe Antiperspirant Roll-On Africa', size: '50ml', packaging: 'tube' },
    ],
  },
  {
    brand: 'Rexona',
    products: [
      { name: 'Rexona Roll-On Cotton Dry', size: '50ml', packaging: 'tube' },
      { name: 'Rexona Roll-On Shower Fresh', size: '50ml', packaging: 'tube' },
      { name: 'Rexona Men Roll-On Cobalt Dry', size: '50ml', packaging: 'tube' },
      { name: 'Rexona Aerosol Cotton Dry', size: '150ml', packaging: 'can' },
    ],
  },
  {
    brand: 'TRESemmé',
    products: [
      { name: 'TRESemmé Shampoo Moisture Rich', size: '750ml', packaging: 'bottle' },
      { name: 'TRESemmé Conditioner Moisture Rich', size: '750ml', packaging: 'bottle' },
      { name: 'TRESemmé Shampoo Keratin Smooth', size: '750ml', packaging: 'bottle' },
      { name: 'TRESemmé Conditioner Keratin Smooth', size: '750ml', packaging: 'bottle' },
      { name: 'TRESemmé Hair Spray Extra Hold', size: '250ml', packaging: 'can' },
    ],
  },
  {
    brand: 'Knorr',
    products: [
      { name: 'Knorr Cup-a-Soup Cream of Mushroom', size: '4x20g', packaging: 'box' },
      { name: 'Knorr Cup-a-Soup Thick Vegetable', size: '4x20g', packaging: 'box' },
      { name: 'Knorr Cup-a-Soup Chicken Noodle', size: '4x20g', packaging: 'box' },
      { name: 'Knorr Soup Powder Beef', size: '50g', packaging: 'sachet' },
      { name: 'Knorr Stock Cubes Beef', size: '12 Pack', packaging: 'box' },
      { name: 'Knorr Stock Cubes Chicken', size: '12 Pack', packaging: 'box' },
      { name: 'Knorr Aromat Original', size: '75g', packaging: 'bottle' },
      { name: 'Knorr Aromat Original', size: '200g', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Knorrox',
    products: [
      { name: 'Knorrox Stock Cubes Beef', size: '12 Pack', packaging: 'box' },
      { name: 'Knorrox Stock Cubes Chicken', size: '12 Pack', packaging: 'box' },
      { name: 'Knorrox Instant Soup Beef', size: '400ml', packaging: 'sachet' },
    ],
  },
  {
    brand: 'Rajah',
    products: [
      { name: 'Rajah Curry Powder Mild & Spicy', size: '100g', packaging: 'box' },
      { name: 'Rajah Curry Powder Hot', size: '100g', packaging: 'box' },
      { name: 'Rajah Curry Powder Medium', size: '100g', packaging: 'box' },
      { name: 'Rajah Curry Powder Mild & Spicy', size: '200g', packaging: 'box' },
    ],
  },
  {
    brand: 'Robertsons',
    products: [
      { name: 'Robertsons Mixed Herbs', size: '18g', packaging: 'bottle' },
      { name: 'Robertsons Chicken Spice', size: '100ml', packaging: 'bottle' },
      { name: 'Robertsons Braai Spice', size: '100ml', packaging: 'bottle' },
      { name: 'Robertsons Steak & Chops Spice', size: '100ml', packaging: 'bottle' },
      { name: 'Robertsons Dried Parsley', size: '12g', packaging: 'bottle' },
    ],
  },
  {
    brand: 'Pepsodent',
    products: [
      { name: 'Pepsodent Toothpaste Cavity Fighter', size: '75ml', packaging: 'tube' },
      { name: 'Pepsodent Toothpaste Whitening', size: '75ml', packaging: 'tube' },
    ],
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Simple auth check - require admin secret or auth token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ message: 'Invalid token' });

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  try {
    let totalInserted = 0;

    // Get brand ID map
    const { data: brands } = await supabase.from('brands').select('id, name');
    const brandMap = new Map(brands?.map((b) => [b.name, b.id]) || []);

    for (const brandData of SEED_PRODUCTS) {
      const brandId = brandMap.get(brandData.brand);
      if (!brandId) {
        console.warn(`Brand "${brandData.brand}" not found, skipping`);
        continue;
      }

      for (const product of brandData.products) {
        // Check if product already exists (avoid duplicates)
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('brand_id', brandId)
          .eq('name', product.name)
          .eq('size_variant', product.size)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const { error } = await supabase.from('products').insert({
          brand_id: brandId,
          name: product.name,
          size_variant: product.size,
          packaging_type: product.packaging,
        });

        if (!error) totalInserted++;
      }
    }

    return res.status(200).json({
      message: `Seeded ${totalInserted} products`,
      total_products: SEED_PRODUCTS.reduce((acc, b) => acc + b.products.length, 0),
      inserted: totalInserted,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Seed failed',
    });
  }
}
