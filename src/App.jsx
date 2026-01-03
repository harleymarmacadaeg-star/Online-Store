import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import ProductModal from './components/ProductModal';
import { supabase } from './supabaseClient';
import InventoryManager from './admin/InventoryManager';
import Checkout from './pages/Checkout'; 
import OrdersDashboard from './admin/OrdersDashboard';
import AddProduct from './admin/AddProduct';

function App() {
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeBrand, setActiveBrand] = useState("All Brands");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ["All", "Blade", "Rubber", "Pips", "Table Tennis ball", "Table Tennis Table","Pickleball", "Apparel", "Shoes"];

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variations(*)'); 
      if (error) console.error("Error fetching products:", error);
      else setProductsData(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const addToCart = (product, variation, quantity = 1) => {
    if (!variation) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === product.id && item.variation_id === variation.id
      );

      if (existingItem) {
        return prevCart.map(item => 
          (item.id === product.id && item.variation_id === variation.id)
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }

      const cartItem = {
        id: product.id,
        variation_id: variation.id,
        name: product.name,
        image_url: product.image_url,
        price: variation.price || product.price,
        // Changed to variation_name to match CartSidebar expectations
        variation_name: `${variation.color || ''} ${variation.handle_type || ''} ${variation.size || ''}`.trim() || 'Standard',
        maxStock: variation.stock_count,
        quantity: quantity
      };

      return [...prevCart, cartItem];
    });
    
    setIsCartOpen(true);
  };

  const updateQuantity = (id, variationId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id && item.variation_id === variationId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty > 0 ? (newQty <= item.maxStock ? newQty : item.maxStock) : 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id, variationId) => {
    setCart(prevCart => prevCart.filter(item => 
      !(item.id === id && item.variation_id === variationId)
    ));
  };

  const clearCart = () => setCart([]);

  const allBrands = ["All Brands", ...new Set(productsData.map(p => p.brand).filter(Boolean))].sort();

  const filteredProducts = productsData.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesBrand = activeBrand === "All Brands" || product.brand === activeBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const ShopView = () => (
    <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
              TABLETENNIS <span className="text-blue-600">Shop</span>
            </h1>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 ml-0.5">
              The Official Online Store of TABLE TENNIS PLAYERS
            </h2>
          </div>
          <div className="flex gap-4">
            <Link to="/admin/inventory" className="text-[10px] font-bold uppercase border-b-2 border-black pb-1 hover:text-blue-600 transition-all">Inventory</Link>
            <Link to="/admin/orders" className="text-[10px] font-bold uppercase border-b-2 border-blue-600 pb-1 text-blue-600 hover:text-black hover:border-black transition-all">Orders</Link>
          </div>
        </header>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setActiveBrand("All Brands"); }}
                className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeCategory === cat ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 border-l pl-4 border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Brand</span>
            <select 
              value={activeBrand}
              onChange={(e) => setActiveBrand(e.target.value)}
              className="bg-gray-50 border-none rounded-lg px-4 py-2 text-sm font-bold text-gray-700 outline-none cursor-pointer"
            >
              {allBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-bold uppercase text-xs">Loading Inventory...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                <ProductCard product={product} onAddToCart={(e) => { e.stopPropagation(); setSelectedProduct(product); }} />
              </div>
            ))}
          </div>
        )}
    </main>
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)}
        />
        <Routes>
          <Route path="/" element={<ShopView />} />
          <Route path="/admin/inventory" element={<InventoryManager />} />
          <Route path="/admin/add-product" element={<AddProduct />} />
          <Route path="/admin/orders" element={<OrdersDashboard />} />
          <Route path="/checkout" element={<Checkout cart={cart} onClearCart={clearCart} />} />
        </Routes>

        <CartSidebar 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cart={cart} 
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClearCart={clearCart}
        />

        <ProductModal 
          product={selectedProduct} 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart} 
        />
      </div>
    </Router>
  );
}

export default App;