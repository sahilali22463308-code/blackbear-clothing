(function () {
  const cfg = window.BLACKBEAR_CONFIG || {};
  const ready = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('PASTE_') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('PASTE_');

  async function supabaseRequest(path, options = {}) {
    if (!ready) throw new Error('Supabase is not configured yet.');
    const headers = Object.assign({
      apikey: cfg.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + cfg.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }, options.headers || {});
    const res = await fetch(cfg.SUPABASE_URL + '/rest/v1/' + path, Object.assign({}, options, { headers }));
    if (!res.ok) throw new Error(await res.text());
    return res.status === 204 ? null : res.json();
  }

  async function getProducts() {
    if (!ready) return JSON.parse(localStorage.getItem('blackbear_products') || '[]');
    return supabaseRequest('products?select=*&order=created_at.desc');
  }

  async function addProduct(product) {
    if (!ready) {
      const list = JSON.parse(localStorage.getItem('blackbear_products') || '[]');
      const item = Object.assign({ id: crypto.randomUUID(), created_at: new Date().toISOString() }, product);
      list.unshift(item); localStorage.setItem('blackbear_products', JSON.stringify(list)); return item;
    }
    const rows = await supabaseRequest('products', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(product) });
    return rows[0];
  }

  async function updateProduct(id, product) {
    if (!ready) {
      const list = JSON.parse(localStorage.getItem('blackbear_products') || '[]').map(p => p.id === id ? Object.assign({}, p, product) : p);
      localStorage.setItem('blackbear_products', JSON.stringify(list)); return;
    }
    await supabaseRequest('products?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(product) });
  }

  async function deleteProduct(id) {
    if (!ready) {
      const list = JSON.parse(localStorage.getItem('blackbear_products') || '[]').filter(p => p.id !== id);
      localStorage.setItem('blackbear_products', JSON.stringify(list)); return;
    }
    await supabaseRequest('products?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
  }

  async function createOrder(order) {
    if (!ready) {
      const list = JSON.parse(localStorage.getItem('blackbear_orders') || '[]');
      const item = Object.assign({ id: crypto.randomUUID(), created_at: new Date().toISOString(), status: 'pending' }, order);
      list.unshift(item); localStorage.setItem('blackbear_orders', JSON.stringify(list)); return item;
    }
    const rows = await supabaseRequest('orders', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(order) });
    return rows[0];
  }

  async function getOrders() {
    if (!ready) return JSON.parse(localStorage.getItem('blackbear_orders') || '[]');
    return supabaseRequest('orders?select=*&order=created_at.desc');
  }

  window.BlackBearStore = { ready, getProducts, addProduct, updateProduct, deleteProduct, createOrder, getOrders };
})();
