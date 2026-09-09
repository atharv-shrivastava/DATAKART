import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = Number(process.env.PORT || 4000);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are not configured.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'datakart', status: 'ok' });
});

app.get('/api/products/gtin/:gtin', async (req, res) => {
  const gtin = String(req.params.gtin || '').trim();
  if (!gtin) return res.status(400).json({ error: 'GTIN is required.' });

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('gtin', gtin)
    .eq('active', true)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ found: false, gtin });

  res.json({ found: true, product: data });
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
