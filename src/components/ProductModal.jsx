import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingCart, X } from 'lucide-react';

export default function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const [variations, setVariations] = useState([]);
  const [selectedVar, setSelectedVar] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && product) {
      const fetchVars = async () => {
        const { data } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', product.id);
        
        setVariations(data || []);
        if (data?.length > 0) setSelectedVar(data[0]);
      };
      fetchVars();
      setQuantity(1); // Reset quantity when opening new product
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // The critical function that was missing/unlinked
  const handleAddClick = () => {
    if (selectedVar) {
      onAddToCart(product, selectedVar, quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[40px] max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full z-10">
          <X />
        </button>

        <div className="bg-slate-50 p-12 flex items-center justify-center">
          <img src={product.image_url} alt={product.name} className="max-h-80 object-contain drop-shadow-2xl" />
        </div>

        <div className="p-10 space-y-6">
          <div>
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">{product.brand}</h2>
            <h1 className="text-4xl font-black uppercase italic leading-none">{product.name}</h1>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-400">Select Variation</p>
            <div className="flex flex-wrap gap-2">
              {variations.map((v) => {
                const label = v.handle_type || v.color || v.size || 'Standard';
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVar(v)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold ${
                      selectedVar?.id === v.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="uppercase">{label}</div>
                    <div className="text-[10px] opacity-60">Stock: {v.stock_count}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-end justify-between pt-6 border-t">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Unit Price</p>
              <p className="text-3xl font-black text-blue-600">₱{selectedVar?.price || product.price}</p>
            </div>
            
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 font-bold">-</button>
               <span className="px-4 font-black">{quantity}</span>
               <button 
                onClick={() => setQuantity(prev => (selectedVar && prev < selectedVar.stock_count) ? prev + 1 : prev)} 
                className="px-3 font-bold"
               >+</button>
            </div>
          </div>

          <button 
            onClick={handleAddClick} // FIXED: Added the click handler
            disabled={!selectedVar || selectedVar.stock_count === 0}
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:bg-slate-300 transition-all hover:bg-blue-600"
          >
            <ShoppingCart size={20} />
            {selectedVar?.stock_count === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}