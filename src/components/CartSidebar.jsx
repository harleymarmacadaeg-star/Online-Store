import { X, Trash2, Plus, Minus, MessageCircle, ShoppingBag, RotateCcw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CartSidebar({ isOpen, onClose, cart = [], onUpdateQuantity, onRemove, onClearCart }) {
  const navigate = useNavigate();
  
  const currentItems = Array.isArray(cart) ? cart : [];
  const total = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleMessengerCheckout = () => {
    const itemSummary = currentItems
      .map(item => `• ${item.quantity}x ${item.name} (${item.variation_name || 'Standard'}) - ₱${item.price.toLocaleString()}`)
      .join('\n');

    const message = encodeURIComponent(
  `Hello HJM! I would like to order:\n\n${itemSummary}\n\nTotal: ₱${total.toLocaleString()}\n\nIs this available?`
);

// Updated to your personal profile username
window.open(`https://m.me/harleymar.macadaeg?text=${message}`, '_blank');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-white">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
                My Gear
              </h2>
              {currentItems.length > 0 && (
                <button 
                  onClick={() => confirm("Empty your cart?") && onClearCart()}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">HJM-Build-It Table Tennis Store</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-blue-500" /></div>
              <p className="text-gray-900 font-black uppercase text-sm tracking-widest">Your Bag is Empty</p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentItems.map((item) => (
                <div key={`${item.id}-${item.variation_id}`} className="flex gap-4 animate-in fade-in slide-in-from-right-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex-shrink-0 border flex items-center justify-center p-2 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-xs text-gray-900 uppercase leading-tight line-clamp-2">{item.name}</h4>
                        <p className="text-[9px] font-black text-blue-600 uppercase mt-1">{item.variation_name}</p>
                      </div>
                      <button 
                        onClick={() => onRemove(item.id, item.variation_id)}
                        className="text-gray-300 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-gray-900 font-black text-sm italic">₱{(item.price * item.quantity).toLocaleString()}</p>
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.variation_id, -1)} 
                          className="px-2 py-1 hover:bg-white border-r"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-black text-xs text-gray-900">{item.quantity}</span>
                        <button 
                          disabled={item.quantity >= item.maxStock}
                          onClick={() => onUpdateQuantity(item.id, item.variation_id, 1)} 
                          className={`px-2 py-1 border-l ${item.quantity >= item.maxStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'hover:bg-white'}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {currentItems.length > 0 && (
          <div className="p-8 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Estimated Total</span>
              <span className="font-black text-3xl text-gray-900 italic tracking-tighter">₱{total.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { navigate('/checkout'); onClose(); }}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleMessengerCheckout}
                className="w-full border-2 border-gray-100 text-gray-500 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-4 h-4" /> Order via Messenger
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}