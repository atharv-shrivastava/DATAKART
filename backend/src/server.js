import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = Number(process.env.PORT || 4000);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[DataKart] SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are not configured.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');
app.use(cors());
app.use(express.json());

function gtinVariants(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return [];
  const variants = new Set([digits]);
  if (digits.length === 14 && digits.startsWith('0')) variants.add(digits.slice(1));
  if (digits.length === 13) variants.add(`0${digits}`);
  if (digits.length === 12) {
    variants.add(`0${digits}`);
    variants.add(`00${digits}`);
  }
  if (digits.length === 8) variants.add(`000000${digits}`);
  return [...variants];
}

app.get('/health', (_req, res) => {
  res.json({ service: 'datakart', status: 'ok' });
});

app.get('/api/products/gtin/:gtin', async (req, res) => {
  const requestedGtin = String(req.params.gtin || '').trim();
  const candidates = gtinVariants(requestedGtin);
  console.log(`[DataKart] GTIN lookup requested=${requestedGtin} candidates=${JSON.stringify(candidates)}`);
  if (!candidates.length) return res.status(400).json({ error: 'GTIN is required.' });

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('gtin', candidates)
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[DataKart] Supabase lookup error:', error.message);
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    console.log(`[DataKart] NOT FOUND requested=${requestedGtin}`);
    return res.status(404).json({ found: false, gtin: requestedGtin });
  }

  console.log(`[DataKart] FOUND requested=${requestedGtin} stored=${data.gtin} product=${JSON.stringify({ id: data.id, product_name: data.product_name, mrp: data.mrp, net_quantity: data.net_quantity, unit: data.unit })}`);
  res.json({ found: true, product: data, matchedGtin: data.gtin });
});

app.get('/api/products', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: data || [] });
});

app.listen(port, () => {
  console.log(`DataKart API listening on http://localhost:${port}`);
});
