import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, Save, Image as ImageIcon, 
  Layers, X, RefreshCw, Trash2, AlignLeft
} from 'lucide-react';

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
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

  const addOption = (tier, setTier, value) => {
    if (!value.trim()) return;
    setTier(prev => ({ ...prev, options: [...new Set([...prev.options, value.trim()])] }));
  };

  const generateMatrix = () => {
    let newRows = [];
    const basePrice = parseFloat(productForm.price) || 0;

    if (tier1.options.length > 0 && tier2.options.length === 0) {
      newRows = tier1.options.map(opt => ({ color: opt, price: basePrice, stock_count: 0 }));
    } else if (tier1.options.length > 0 && tier2.options.length > 0) {
      tier1.options.forEach(m => {
        tier2.options.forEach(s => {
          newRows.push({ color: `${m}, ${s}`, price: basePrice, stock_count: 0 });
        });
      });
    }
    setMatrix(newRows);
  };

  const handleSave = async () => {
    if (!productForm.name) return alert("Product name is required");
    setLoading(true);

    const { data: newProduct, error: pError } = await supabase
      .from('products')
      .insert([productForm])
      .select()
      .single();

    if (pError) {
      alert("Error: " + pError.message);
      setLoading(false);
      return;
    }

    if (matrix.length > 0) {
      const variations = matrix.map(m => ({
        product_id: newProduct.id,
        color: m.color,
        price: parseFloat(m.price) || productForm.price,
        stock_count: parseInt(m.stock_count) || 0
      }));
      await supabase.from('product_variations').insert(variations);
    }

    setLoading(false);
    navigate('/admin/inventory');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 font-sans">
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-5">
            <Link to="/admin/inventory" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all">
              <ChevronLeft className="w-6 h-6"/>
            </Link>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Add New Product</h2>
          </div>
          <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Product Details & Visuals */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-[11px] font-black text-blue-600 uppercase mb-8 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Visuals & Info</h3>
              
              <div className="space-y-6">
                {/* Fixed Image Preview */}
                <div className="w-full h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {productForm.image_url ? (
                    <img src={productForm.image_url} className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="text-center text-slate-300">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase">No Preview Available</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <input className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Image URL" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} />
                  <input className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-black border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Product Name" onChange={e => setProductForm({...productForm, name: e.target.value})} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Brand" onChange={e => setProductForm({...productForm, brand: e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Category" onChange={e => setProductForm({...productForm, category: e.target.value})} />
                  </div>

                  <input className="w-full p-4 bg-slate-50 rounded-2xl text-blue-600 font-black border-2 border-transparent focus:border-blue-500 outline-none" type="number" placeholder="Base Price (₱)" onChange={e => setProductForm({...productForm, price: e.target.value})} />
                  
                  {/* Fixed Description Box */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Description</label>
                    <textarea className="w-full p-5 bg-slate-50 rounded-[1.5rem] text-xs font-medium border-2 border-transparent focus:border-blue-500 outline-none h-32 resize-none" placeholder="Product details..." onChange={e => setProductForm({...productForm, description: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Variations */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-[11px] font-black text-blue-600 uppercase mb-8 flex items-center gap-2"><Layers className="w-4 h-4"/> Step 1: Configure Tiers</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <input className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs" placeholder="Tier 1 Name (e.g. Color)" value={tier1.name} onChange={e => setTier1({...tier1, name: e.target.value})} />
                  <div className="flex flex-wrap gap-2">
                    {tier1.options.map((opt, i) => (
                      <span key={i} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-2">{opt} <X className="w-3 h-3 cursor-pointer" onClick={() => setTier1({...tier1, options: tier1.options.filter((_, idx) => idx !== i)})} /></span>
                    ))}
                  </div>
                  <input className="w-full p-4 border-2 border-dashed rounded-xl text-xs" placeholder="Add option & press Enter" onKeyDown={e => { if(e.key === 'Enter') { addOption(tier1, setTier1, e.target.value); e.target.value = ''; }}} />
                </div>
                <div className="space-y-3">
                  <input className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs" placeholder="Tier 2 Name (e.g. Size)" value={tier2.name} onChange={e => setTier2({...tier2, name: e.target.value})} />
                  <div className="flex flex-wrap gap-2">
                    {tier2.options.map((opt, i) => (
                      <span key={i} className="bg-slate-800 text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-2">{opt} <X className="w-3 h-3 cursor-pointer" onClick={() => setTier2({...tier2, options: tier2.options.filter((_, idx) => idx !== i)})} /></span>
                    ))}
                  </div>
                  <input className="w-full p-4 border-2 border-dashed rounded-xl text-xs" placeholder="Add option & press Enter" onKeyDown={e => { if(e.key === 'Enter') { addOption(tier2, setTier2, e.target.value); e.target.value = ''; }}} />
                </div>
              </div>
              <button onClick={generateMatrix} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                <RefreshCw className="w-4 h-4" /> Generate Variation Matrix
              </button>
            </div>

            {/* Matrix List (Existing UI preserved) */}
            {matrix.length > 0 && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-h-[500px] overflow-y-auto">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Step 2: Set Stock & Prices</h3>
                <div className="space-y-3">
                  {matrix.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex-1 text-[10px] font-black uppercase text-blue-600">{row.color}</div>
                      <input 
                      className="w-24 p-2 rounded-lg border text-xs font-bold" 
                      type="number" 
                      value={row.price} 
                      onChange={e => {
                        const updated = [...matrix];
                        updated[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                        setMatrix(updated);
                      }} 
                    />
                      <input 
                      className={`w-20 p-2 rounded-lg border text-xs font-bold ${row.stock_count === 0 ? 'bg-red-50 text-red-600' : ''}`} 
                      type="number" 
                      value={row.stock_count} 
                      onChange={e => {
                        const updated = [...matrix];
                        updated[idx].stock_count = Math.max(0, parseInt(e.target.value) || 0);
                        setMatrix(updated);
                      }} 
                    />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}