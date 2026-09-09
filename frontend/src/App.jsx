import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

const emptyForm = {
  gtin: '', product_name: '', brand_name: '', manufacturer: '', manufacturer_address: '',
  packer: '', packer_address: '', marketer: '', marketer_address: '', importer: '', importer_address: '',
  net_quantity: '', unit: '', mrp: '', currency: 'INR', date_of_manufacture: '', date_of_packing: '',
  best_before: '', expiry_date: '', batch_number: '', consumer_care_phone: '', consumer_care_email: '',
  country_of_origin: '', fssai_license_number: '', barcode: '', product_category: '', product_subcategory: '',
  description: '', image_url: ''
};

const fields = [
  ['gtin','GTIN *'], ['product_name','Product name *'], ['brand_name','Brand'], ['manufacturer','Manufacturer'],
  ['manufacturer_address','Manufacturer address'], ['packer','Packer'], ['packer_address','Packer address'],
  ['marketer','Marketer'], ['marketer_address','Marketer address'], ['importer','Importer'], ['importer_address','Importer address'],
  ['net_quantity','Net quantity'], ['unit','Unit'], ['mrp','MRP'], ['currency','Currency'],
  ['date_of_manufacture','Date of manufacture'], ['date_of_packing','Date of packing'], ['best_before','Best before'],
  ['expiry_date','Expiry date'], ['batch_number','Batch / lot number'], ['consumer_care_phone','Consumer care phone'],
  ['consumer_care_email','Consumer care email'], ['country_of_origin','Country of origin'], ['fssai_license_number','FSSAI licence'],
  ['barcode','Barcode'], ['product_category','Category'], ['product_subcategory','Subcategory'], ['description','Description'], ['image_url','Image URL']
];

function App() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [auth, setAuth] = useState({ email: '', password: '', mode: 'login' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) setMessage(error.message); else setProducts(data || []);
  };

  useEffect(() => { loadProducts(); }, []);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => [p.gtin, p.product_name, p.brand_name, p.manufacturer, p.barcode]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [products, query]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const signIn = async (e) => {
    e.preventDefault(); setBusy(true); setMessage('');
    const fn = auth.mode === 'login' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn({ email: auth.email, password: auth.password });
    setBusy(false); setMessage(error ? error.message : auth.mode === 'login' ? 'Signed in.' : 'Account created. Check your email if confirmation is enabled.');
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!session) return setMessage('Sign in as admin to add products.');
    setBusy(true); setMessage('');
    const payload = { ...form };
    for (const key of ['net_quantity','mrp']) payload[key] = payload[key] === '' ? null : Number(payload[key]);
    const { error } = await supabase.from('products').insert(payload);
    setBusy(false);
    if (error) return setMessage(error.message);
    setForm(emptyForm); setMessage('Product added.'); await loadProducts();
  };

  const deleteProduct = async (id) => {
    if (!session || !window.confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    setMessage(error ? error.message : 'Product deleted.');
    if (!error) await loadProducts();
  };

  return <div className="app">
    <header>
      <div><span className="eyebrow">STANDALONE PRODUCT DATA SERVICE</span><h1>DataKart</h1><p>Mock national product reference database for Parakh.</p></div>
      <div className="auth">
        {session ? <><span>{session.user.email}</span><button onClick={() => supabase.auth.signOut()}>Sign out</button></> : <form onSubmit={signIn} className="auth-form"><input placeholder="admin email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/><input type="password" placeholder="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/><button disabled={busy}>{auth.mode==='login'?'Admin login':'Create account'}</button><button type="button" className="ghost" onClick={()=>setAuth({...auth,mode:auth.mode==='login'?'signup':'login'})}>{auth.mode==='login'?'Sign up':'Back to login'}</button></form>}
      </div>
    </header>

    {message && <div className="notice">{message}</div>}

    <main>
      <section className="panel lookup">
        <div className="panel-head"><div><h2>GTIN lookup</h2><p>Search the reference catalogue by GTIN, barcode, product, brand, or manufacturer.</p></div><input className="search" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
        <div className="table-wrap"><table><thead><tr><th>GTIN</th><th>Product</th><th>Brand</th><th>MRP</th><th>Net qty</th><th>Category</th><th>Admin</th></tr></thead><tbody>
          {visibleProducts.map(p=><tr key={p.id}><td><code>{p.gtin}</code></td><td><strong>{p.product_name}</strong></td><td>{p.brand_name||'—'}</td><td>{p.currency} {p.mrp ?? '—'}</td><td>{p.net_quantity ?? '—'} {p.unit || ''}</td><td>{p.product_category||'—'}</td><td>{session ? <button className="danger" onClick={()=>deleteProduct(p.id)}>Delete</button> : 'Read only'}</td></tr>)}
          {!visibleProducts.length && <tr><td colSpan="7" className="empty">No products found.</td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel add-panel">
        <div className="panel-head"><div><h2>Add product</h2><p>{session ? 'Create a reference record in the DataKart database.' : 'Admin authentication is required for write access.'}</p></div></div>
        <form onSubmit={addProduct} className="grid-form">
          {fields.map(([key,label]) => <label key={key}>{label}<input type={['net_quantity','mrp'].includes(key)?'number':'text'} step="any" value={form[key]} onChange={e=>update(key,e.target.value)} required={key==='gtin'||key==='product_name'} disabled={!session}/></label>)}
          <button className="primary" disabled={!session || busy}>Save product</button>
        </form>
      </section>

      <section className="api-card"><div><span className="eyebrow">FOR PARAKH</span><h2>GTIN API endpoint</h2><p><code>GET /api/products/gtin/:gtin</code></p><p className="muted">The frontend catalogue is separate from Parakh. Parakh should call the API and treat returned data as reference evidence, not as a legal-compliance verdict.</p></div></section>
    </main>
    <footer>DataKart mock service · Separate database · Supabase PostgreSQL</footer>
  </div>;
}

export default App;
