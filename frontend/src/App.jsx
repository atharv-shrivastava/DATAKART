import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

const emptyForm = {
  gtin: '', product_name: '', brand_name: '', manufacturer: '', manufacturer_address: '',
  packer: '', packer_address: '', marketer: '', marketer_address: '', importer: '', importer_address: '',
  net_quantity: '', unit: '', mrp: '', currency: 'INR', date_of_manufacture: '', date_of_packing: '',
  best_before: '', expiry_date: '', batch_number: '', consumer_care_phone: '', consumer_care_email: '',
  country_of_origin: '', fssai_license_number: '', barcode: '', description: ''
};

const fields = [
  ['gtin', 'GTIN *'],
  ['product_name', 'Product name *'],
  ['brand_name', 'Brand'],
  ['manufacturer', 'Manufacturer'],
  ['manufacturer_address', 'Manufacturer address'],
  ['packer', 'Packer'],
  ['packer_address', 'Packer address'],
  ['marketer', 'Marketer'],
  ['marketer_address', 'Marketer address'],
  ['importer', 'Importer'],
  ['importer_address', 'Importer address'],
  ['net_quantity', 'Net quantity'],
  ['unit', 'Unit'],
  ['mrp', 'MRP'],
  ['currency', 'Currency'],
  ['date_of_manufacture', 'Date of manufacture'],
  ['date_of_packing', 'Date of packing'],
  ['best_before', 'Best before'],
  ['expiry_date', 'Expiry date'],
  ['batch_number', 'Batch / lot number'],
  ['consumer_care_phone', 'Consumer care phone'],
  ['consumer_care_email', 'Consumer care email'],
  ['country_of_origin', 'Country of origin'],
  ['fssai_license_number', 'FSSAI licence'],
  ['barcode', 'Barcode'],
  ['description', 'Description']
];

function App() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setMessage(error.message);
    else setProducts(data || []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) =>
      [p.gtin, p.product_name, p.brand_name, p.manufacturer, p.barcode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [products, query]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addProduct = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const payload = { ...form };
    for (const key of ['net_quantity', 'mrp']) {
      payload[key] = payload[key] === '' ? null : Number(payload[key]);
    }

    const { error } = await supabase.from('products').insert(payload);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm(emptyForm);
    setMessage('Product registered successfully.');
    await loadProducts();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product from DataKart?')) return;

    setBusy(true);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setBusy(false);

    setMessage(error ? error.message : 'Product deleted.');
    if (!error) await loadProducts();
  };

  return (
    <div className="app">
      <header>
        <div>
          <span className="eyebrow">STANDALONE PRODUCT DATA SERVICE</span>
          <h1>DataKart</h1>
          <p>Product reference database for Parakh.</p>
        </div>
        <div className="header-actions">
          <span className="status-badge">Public demo registry</span>
        </div>
      </header>

      {message && <div className="notice">{message}</div>}

      <main>
        <section className="panel lookup">
          <div className="panel-head">
            <div>
              <h2>Registered products</h2>
              <p>Search registered products by GTIN, product name, brand, manufacturer, or barcode.</p>
            </div>
            <input
              className="search"
              placeholder="Search products…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>GTIN</th>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Manufacturer</th>
                  <th>MRP</th>
                  <th>Net qty</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td><code>{product.gtin}</code></td>
                    <td><strong>{product.product_name}</strong></td>
                    <td>{product.brand_name || '—'}</td>
                    <td>{product.manufacturer || '—'}</td>
                    <td>{product.currency} {product.mrp ?? '—'}</td>
                    <td>{product.net_quantity ?? '—'} {product.unit || ''}</td>
                    <td>
                      <button
                        className="danger"
                        onClick={() => deleteProduct(product.id)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!visibleProducts.length && (
                  <tr>
                    <td colSpan="7" className="empty">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel add-panel">
          <div className="panel-head">
            <div>
              <h2>Register product</h2>
              <p>Add the product information that Parakh can use as reference data.</p>
            </div>
          </div>

          <form onSubmit={addProduct} className="grid-form">
            {fields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={['net_quantity', 'mrp'].includes(key) ? 'number' : 'text'}
                  step="any"
                  value={form[key]}
                  onChange={(event) => update(key, event.target.value)}
                  required={key === 'gtin' || key === 'product_name'}
                />
              </label>
            ))}

            <button className="primary" disabled={busy}>
              {busy ? 'Saving…' : 'Add product'}
            </button>
          </form>
        </section>

        <section className="api-card">
          <div>
            <span className="eyebrow">FOR PARAKH</span>
            <h2>GTIN API endpoint</h2>
            <p><code>GET /api/products/gtin/:gtin</code></p>
            <p className="muted">
              Parakh can query DataKart by GTIN and use the returned product fields as reference evidence.
              DataKart remains a separate database from the Parakh application.
            </p>
          </div>
        </section>
      </main>

      <footer>DataKart · Separate product registry · Supabase PostgreSQL</footer>
    </div>
  );
}

export default App;
