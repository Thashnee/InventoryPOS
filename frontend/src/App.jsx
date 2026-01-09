import { useState, useEffect } from 'react';

// Use environment variable for API URL, fallback to local development
const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/check`, { credentials: 'include' });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#667eea' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <MainApp onLogout={handleLogout} />;
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await onLogin(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '0.5rem',
          color: '#333',
          fontSize: '2rem'
        }}>
          📦 C.V. JOINT MAC
        </h1>
        <p style={{ 
          textAlign: 'center', 
          color: '#666',
          marginBottom: '2rem',
          fontSize: '0.875rem'
        }}>
          Inventory & POS System
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '600'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '600'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c00',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#999'
        }}>
          Default: admin / admin123
        </p>
      </div>
    </div>
  );
}

function MainApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await fetch(`${API_URL}/dashboard/stats`, { credentials: 'include' });
        const data = await res.json();
        setStats(data);
      } else if (activeTab === 'inventory') {
        const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
        const data = await res.json();
        setProducts(data);
      } else if (activeTab === 'pos') {
        const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
        const data = await res.json();
        setProducts(data);
      } else if (activeTab === 'sales') {
        const res = await fetch(`${API_URL}/sales`, { credentials: 'include' });
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  const addProduct = async (product) => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(product)
      });
      if (res.ok) {
        loadData();
        return true;
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
    return false;
  };

  const updateProduct = async (id, product) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(product)
      });
      if (res.ok) {
        loadData();
        return true;
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
    return false;
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        loadData();
        alert('Product deleted successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product');
    }
  };

  const toggleProductActive = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
    }
  };

  const completeSale = async (saleData) => {
    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(saleData)
      });
      if (res.ok) {
        const sale = await res.json();
        setCart([]);
        alert(`Sale completed! Invoice: ${sale.invoice_number}`);
        return sale;
      }
    } catch (err) {
      console.error('Error completing sale:', err);
      alert('Error completing sale');
    }
    return null;
  };

  const downloadInvoice = async (saleId) => {
    try {
      const res = await fetch(`${API_URL}/sales/${saleId}/invoice`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${saleId}.pdf`;
      a.click();
    } catch (err) {
      console.error('Error downloading invoice:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
          📦 Inventory & POS System
        </h1>
        <button
          onClick={onLogout}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid white',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          Logout
        </button>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <aside style={{
          width: '250px',
          background: 'white',
          borderRight: '1px solid #e0e0e0',
          padding: '1rem'
        }}>
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard
          </TabButton>
          <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
            📦 Inventory
          </TabButton>
          <TabButton active={activeTab === 'pos'} onClick={() => setActiveTab('pos')}>
            💳 Point of Sale
          </TabButton>
          <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>
            📄 Sales History
          </TabButton>
        </aside>

        <main style={{ flex: 1, padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
          ) : (
            <>
              {activeTab === 'dashboard' && stats && (
                <Dashboard stats={stats} />
              )}
              {activeTab === 'inventory' && (
                <Inventory 
                  products={products}
                  onAdd={addProduct}
                  onUpdate={updateProduct}
                  onDelete={deleteProduct}
                  onToggleActive={toggleProductActive}
                />
              )}
              {activeTab === 'pos' && (
                <POS 
                  products={products.filter(p => p.active)}
                  cart={cart}
                  setCart={setCart}
                  onComplete={completeSale}
                />
              )}
              {activeTab === 'sales' && (
                <Sales sales={sales} onDownload={downloadInvoice} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: '100%',
      padding: '0.75rem 1rem',
      marginBottom: '0.5rem',
      border: 'none',
      borderRadius: '8px',
      background: active ? '#667eea' : 'transparent',
      color: active ? 'white' : '#666',
      fontSize: '1rem',
      fontWeight: active ? '600' : '400',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s'
    }}>
      {children}
    </button>
  );
}

function Dashboard({ stats }) {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Products" value={stats.total_products} color="#667eea" />
        <StatCard title="Low Stock Items" value={stats.low_stock_count} color="#f093fb" />
        <StatCard title="Total Sales" value={stats.total_sales} color="#4facfe" />
        <StatCard title="Total Revenue" value={stats.total_revenue} color="#43e97b" />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Sales</h3>
        {stats.recent_sales.length === 0 ? (
          <p style={{ color: '#999' }}>No sales yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Invoice</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_sales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem' }}>{sale.invoice_number}</td>
                    <td style={{ padding: '0.75rem' }}>{sale.customer_name || 'Walk-in'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                      R {sale.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: color }}>{value}</div>
    </div>
  );
}

function Inventory({ products, onAdd, onUpdate, onDelete, onToggleActive }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', price: '', cost: '', quantity: '', min_stock: '', category: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = editingProduct
      ? await onUpdate(editingProduct.id, formData)
      : await onAdd(formData);
    
    if (success) {
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', sku: '', description: '', price: '', cost: '', quantity: '', min_stock: '', category: '' });
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowForm(true);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    const search = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      (product.category && product.category.toLowerCase().includes(search))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0 }}>Inventory Management</h2>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: '#667eea',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="🔍 Search by name, SKU, or category..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            ...inputStyle,
            width: '100%',
            fontSize: '1rem',
            padding: '0.875rem 1rem'
          }}
        />
        {searchTerm && (
          <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Product Name *"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="SKU *"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                required
                style={inputStyle}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price *"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                required
                style={inputStyle}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Cost"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Min Stock Level"
                value={formData.min_stock}
                onChange={e => setFormData({...formData, min_stock: e.target.value})}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                style={inputStyle}
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows="3"
              style={{...inputStyle, width: '100%', marginTop: '1rem', resize: 'vertical'}}
            />
            <button type="submit" style={{
              background: '#43e97b',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem',
              fontWeight: '600'
            }}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {filteredProducts.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
            {searchTerm ? `No products found matching "${searchTerm}"` : 'No products yet. Add your first product to get started!'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr 
                    key={product.id} 
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      opacity: product.active ? 1 : 0.5,
                      background: product.active ? 'transparent' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>{product.sku}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                      {product.name}
                      {!product.active && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          color: '#999', 
                          fontSize: '0.875rem',
                          fontStyle: 'italic'
                        }}>
                          (Inactive)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{product.category || '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>R {product.price.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{product.quantity}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {product.low_stock && product.active && (
                        <span style={{
                          background: '#ff6b6b',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          marginRight: '0.5rem'
                        }}>
                          Low Stock
                        </span>
                      )}
                      <span style={{
                        background: product.active ? '#43e97b' : '#999',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem'
                      }}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => startEdit(product)}
                        style={{
                          background: '#4facfe',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginRight: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onToggleActive(product.id)}
                        style={{
                          background: product.active ? '#f093fb' : '#43e97b',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginRight: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        {product.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        style={{
                          background: '#ff6b6b',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function POS({ products, cart, setCart, onComplete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [tax, setTax] = useState(0);

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? {...item, quantity: item.quantity + 1}
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product_id === productId ? {...item, quantity} : item
      ));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const saleData = {
      customer_name: customerName,
      items: cart,
      discount: 0,
      tax,
      payment_method: 'cash'
    };

    const sale = await onComplete(saleData);
    if (sale) {
      setCustomerName('');
      setTax(0);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Point of Sale</h2>
        
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{...inputStyle, width: '100%', marginBottom: '1rem'}}
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                ':hover': { transform: 'translateY(-2px)' }
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {product.name}
              </div>
              <div style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                SKU: {product.sku}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                R {product.price.toFixed(2)}
              </div>
              <div style={{ color: '#999', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Stock: {product.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: '1rem',
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Cart</h3>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {cart.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              Cart is empty
            </p>
          ) : (
            cart.map(item => (
              <div key={item.product_id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{item.name}</div>
                  <div style={{ color: '#999', fontSize: '0.875rem' }}>
                    R {item.price.toFixed(2)} each
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                    style={{
                      background: '#f0f0f0',
                      border: 'none',
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '30px', textAlign: 'center', fontWeight: '600' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                    style={{
                      background: '#f0f0f0',
                      border: 'none',
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                  <div style={{ width: '80px', textAlign: 'right', fontWeight: '600' }}>
                    R {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '1rem' }}>
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            style={{...inputStyle, width: '100%', marginBottom: '1rem'}}
          />
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
              Tax Amount
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={tax}
              onChange={e => setTax(parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Subtotal:</span>
              <span>R {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Tax:</span>
              <span>R {tax.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              paddingTop: '0.5rem',
              borderTop: '2px solid #e0e0e0'
            }}>
              <span>Total:</span>
              <span style={{ color: '#667eea' }}>R {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{
              width: '100%',
              background: cart.length === 0 ? '#ccc' : '#43e97b',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}

function Sales({ sales, onDownload }) {
  return (
    <div>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Sales History</h2>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {sales.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No sales yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Invoice</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Payment</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>{sale.invoice_number}</td>
                    <td style={{ padding: '0.75rem' }}>{sale.customer_name || 'Walk-in'}</td>
                    <td style={{ padding: '0.75rem' }}>{sale.payment_method}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                      R {sale.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => onDownload(sale.id)}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        📄 Download Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '0.75rem',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  fontSize: '1rem',
  width: '100%'
};

export default App;