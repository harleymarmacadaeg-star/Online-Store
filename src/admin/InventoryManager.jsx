import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { 
  Package, Plus, Trash2, ChevronLeft, Save, 
  Image as ImageIcon, X, RefreshCw, Layers, Tag, AlignLeft, Search
} from 'lucide-react';

export default function InventoryManager() {
  const [view, setView] = useState('list');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [productForm, setProductForm] = useState({ 
    name: '', 
    price: 0, 
    image_url: '',
    category: '',
    brand: '',
    description: ''
  });

  const [tier1, setTier1] = useState({ name: 'Model', options: [] });
  const [tier2, setTier2] = useState({ name: 'Size', options: [] });
  const [matrix, setMatrix] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*, product_variations(*)').order('name');
    setProducts(data || []);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductForm({ 
      name: product.name || '', 
      price: product.price || 0, 
      image_url: product.image_url || '',
      category: product.category || '',
      brand: product.brand || '',
      description: product.description || ''
    });

    const existingVariations = product.product_variations || [];
    setMatrix(existingVariations);

    if (existingVariations.length > 0) {
      const t1Options = new Set();
      const t2Options = new Set();
      existingVariations.forEach(v => {
        const split = v.color.split(',');
        if (split[0]) t1Options.add(split[0].trim());
        if (split[1]) t2Options.add(split[1].trim());
      });
      setTier1(prev => ({ ...prev, options: Array.from(t1Options) }));
      setTier2(prev => ({ ...prev, options: Array.from(t2Options) }));
    } else {
      setTier1({ name: 'Model', options: [] });
      setTier2({ name: 'Size', options: [] });
    }
    setView('edit');
  };

  const addOption = (tier, setTier, value) => {
    if (!value.trim()) return;
    setTier({ ...tier, options: [...new Set([...tier.options, value.trim()])] });
  };

  const generateMatrix = () => {
    const existingDataMap = {};
    matrix.forEach(row => {
      const key = row.color.trim();
      existingDataMap[key] = { price: row.price, stock_count: row.stock_count, id: row.id };
    });

    let newRows = [];
    const basePrice = Math.max(0, parseFloat(productForm.price) || 0);

    if (tier1.options.length > 0 && tier2.options.length === 0) {
      newRows = tier1.options.map(opt => {
        const existing = existingDataMap[opt.trim()];
        return {
          id: existing?.id || null,
          color: opt.trim(),
          price: existing ? existing.price : basePrice,
          stock_count: existing ? existing.stock_count : 0
        };
      });
    } else if (tier1.options.length > 0 && tier2.options.length > 0) {
      tier1.options.forEach(m => {
        tier2.options.forEach(s => {
          const comboName = `${m.trim()}, ${s.trim()}`;
          const existing = existingDataMap[comboName];
          newRows.push({
            id: existing?.id || null,
            color: comboName,
            price: existing ? existing.price : basePrice,
            stock_count: existing ? existing.stock_count : 0
          });
        });
      });
    }
    setMatrix(newRows);
  };

  const handleSave = async () => {
    const validatedPrice = Math.max(0, parseFloat(productForm.price) || 0);
    const cleanedMatrix = matrix.map(m => ({
      product_id: selectedProduct.id,
      color: m.color,
      price: Math.max(0, parseFloat(m.price) || 0),
      stock_count: Math.max(0, parseInt(m.stock_count) || 0)
    }));

    const { error: pError } = await supabase.from('products').update({
      ...productForm,
      price: validatedPrice
    }).eq('id', selectedProduct.id);

    await supabase.from('product_variations').delete().eq('product_id', selectedProduct.id);
    const { error: vError } = await supabase.from('product_variations').insert(cleanedMatrix);

    if (!pError && !vError) {
      alert("Product details and variations saved!");
      fetchProducts();
      setView('list');
    }
  };

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(searchLower) ||
      p.brand?.toLowerCase().includes(searchLower) ||
      p.category?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <h1 className="text-xl font-black italic uppercase text-blue-600 tracking-tighter">RJPC SHOP</h1>
        <button onClick={() => setView('list')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}>
          <Package className="w-5 h-5" /> My Products
        </button>
      </aside>

      <main className="flex-1 p-8">
        {view === 'list' ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            
            {/* CORRECTED HEADER SECTION */}
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
              <div className="flex flex-col">
                <h2 className="text-xl font-black uppercase tracking-tight">Inventory</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {filteredProducts.length} Products Found
                </span>
              </div>

              {/* NEW INTERNAL SEARCH BAR */}
              <div className="relative flex-1 max-w-md mx-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search name, brand, or category..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-10 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm font-bold transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3 text-slate-400" />
                  </button>
                )}
              </div>
              
              <Link 
    to="/admin/add-product" 
    className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
  >
    + New Product
  </Link>
            </div>

            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-8 py-4 text-center">Preview</th>
                  <th className="px-4 py-4">Product Details</th>
                  <th className="px-4 py-4">Base Price</th>
                  <th className="px-4 py-4">Stock Status</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => { 
                  const totalStock = p.product_variations?.reduce((acc, v) => acc + (parseInt(v.stock_count) || 0), 0) || 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-6 flex justify-center">
                        <img src={p.image_url} className="w-16 h-16 rounded-2xl object-cover border bg-white shadow-sm" />
                      </td>
                      <td className="px-4 py-6">
                        <p className="font-black text-slate-800 text-sm">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {p.brand || 'NO BRAND'} • {p.category || 'GENERAL'}
                        </p>
                      </td>
                      <td className="px-4 py-6 font-black text-blue-600 text-base">₱{p.price}</td>
                      <td className="px-4 py-6">
                        <div className="flex flex-col gap-1">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full w-fit ${
                            totalStock > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${totalStock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-wider">{totalStock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 ml-1">Total: {totalStock} units</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleEditProduct(p)} className="text-blue-600 font-black text-[10px] uppercase border-2 border-blue-50 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">Edit</button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                      No products found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* EDIT VIEW REMAINS UNCHANGED */
          <div className="max-w-7xl mx-auto pb-20">
            {/* ... rest of your edit view code ... */}
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-5">
                 <button onClick={() => setView('list')} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"><ChevronLeft className="w-6 h-6"/></button>
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Edit Product</h2>
               </div>
               <button onClick={handleSave} className="bg-blue-600 text-white px-10 py-4 rounded-[1.5rem] font-black uppercase flex items-center gap-3 shadow-xl shadow-blue-200 hover:scale-105 transition-all active:scale-95">
                 <Save className="w-5 h-5" /> Save Product
               </button>
             </div>
             {/* ... and all the other fields ... */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-5 space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="text-[11px] font-black text-blue-600 uppercase mb-8 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Visuals & Info</h3>
                   <div className="space-y-6">
                     <div className="group relative w-full h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-blue-400">
                       {productForm.image_url ? <img src={productForm.image_url} className="w-full h-full object-contain p-4" /> : <div className="text-center"><ImageIcon className="w-12 h-12 mx-auto text-slate-200 mb-2" /><p className="text-[10px] font-black text-slate-300 uppercase">No Image Found</p></div>}
                     </div>
                     <div className="space-y-4">
                       <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Image URL</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs border-2 border-transparent focus:border-blue-500 outline-none transition-all" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} /></div>
                       <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Product Name</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                       <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Brand</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs border-2 border-transparent focus:border-blue-500 outline-none transition-all" value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} /></div>
                         <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Category</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs border-2 border-transparent focus:border-blue-500 outline-none transition-all" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} /></div>
                       </div>
                       <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Base Price (₱)</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-black text-blue-600 border-2 border-transparent focus:border-blue-500 outline-none transition-all" type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
                       <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Description</label><textarea className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-medium text-xs border-2 border-transparent focus:border-blue-500 outline-none transition-all h-40 resize-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="lg:col-span-7 space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="text-[11px] font-black text-blue-600 uppercase mb-8 flex items-center gap-2"><Layers className="w-4 h-4"/> Step 1: Configure Tiers</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tier 1: {tier1.name}</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs mb-2 border-2 border-transparent focus:border-blue-500 outline-none" value={tier1.name} onChange={e => setTier1({...tier1, name: e.target.value})} />
                       <div className="flex flex-wrap gap-2">{tier1.options.map((opt, i) => (<span key={i} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">{opt} <X className="w-3 h-3 cursor-pointer" onClick={() => setTier1({...tier1, options: tier1.options.filter((_, idx) => idx !== i)})} /></span>))}</div>
                       <input className="w-full p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold outline-none" placeholder="Add option" onKeyDown={e => { if(e.key === 'Enter') { addOption(tier1, setTier1, e.target.value); e.target.value = ''; }}} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tier 2: {tier2.name}</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs mb-2 border-2 border-transparent focus:border-blue-500 outline-none" value={tier2.name} onChange={e => setTier2({...tier2, name: e.target.value})} />
                       <div className="flex flex-wrap gap-2">{tier2.options.map((opt, i) => (<span key={i} className="bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">{opt} <X className="w-3 h-3 cursor-pointer" onClick={() => setTier2({...tier2, options: tier2.options.filter((_, idx) => idx !== i)})} /></span>))}</div>
                       <input className="w-full p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold outline-none" placeholder="Add option" onKeyDown={e => { if(e.key === 'Enter') { addOption(tier2, setTier2, e.target.value); e.target.value = ''; }}} />
                     </div>
                   </div>
                   <button onClick={generateMatrix} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black flex items-center justify-center gap-3 transition-all"><RefreshCw className="w-4 h-4" /> Generate Variation Matrix</button>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Step 2: Set Individual Stock & Prices ({matrix.length})</h3>
                   <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                     {matrix.map((row, idx) => (
                       <div key={idx} className="flex flex-wrap items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all">
                         <div className="flex-1 min-w-[150px]"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Variation</span><span className="text-xs font-black uppercase text-blue-600">{row.color}</span></div>
                         <div className="w-32"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Price (₱)</span><input className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-blue-500 shadow-inner" type="number" value={row.price} onChange={e => { const updated = [...matrix]; const val = parseFloat(e.target.value); updated[idx].price = val < 0 ? 0 : e.target.value; setMatrix(updated); }} /></div>
                         <div className="w-24"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stock</span><input className={`w-full px-4 py-3 border rounded-xl text-xs font-black outline-none transition-all shadow-inner ${(!row.stock_count || parseInt(row.stock_count) === 0) ? 'bg-red-50 border-red-200 text-red-600 focus:border-red-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'}`} type="number" value={row.stock_count} onChange={e => { const updated = [...matrix]; const val = parseInt(e.target.value); updated[idx].stock_count = isNaN(val) ? 0 : Math.max(0, val); setMatrix(updated); }} /></div>
                         <button onClick={() => setMatrix(matrix.filter((_, i) => i !== idx))} className="mt-4 p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}