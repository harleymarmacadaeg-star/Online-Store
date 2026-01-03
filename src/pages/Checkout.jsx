import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Send, CheckCircle } from 'lucide-react';

export default function Checkout({ cart, onClearCart }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      // 1. Insert into 'orders' table
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: formData.name,
          customer_phone: formData.phone,
          shipping_address: formData.address,
          total_amount: total,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Prepare order items
      const orderItems = cart.map(item => {
        // Clean the ID: Ensure it's a number and handle missing variation_id gracefully
        const vId = item.variation_id ? parseInt(item.variation_id) : null;
        
        return {
          order_id: order.id,
          product_id: parseInt(item.id), 
          variation_id: vId,
          quantity: item.quantity,
          unit_price: item.price
        };
      });

      // 3. Insert into 'order_items' table
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error("Order Items Insert Error:", itemsError);
        throw new Error("Could not save items to order.");
      }

      // 4. Success!
      setOrderComplete(true);
      onClearCart();
      
    } catch (error) {
      console.error("Order Error Detail:", error);
      alert(`Order Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Order Received!</h2>
        <p className="text-gray-500 max-w-xs mb-8 font-medium">Thank you for choosing RJPC. We will contact you shortly via phone for delivery details.</p>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200">
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 font-black uppercase text-[10px] tracking-widest mb-8 hover:text-black transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Shop
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Form */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black uppercase italic mb-6 tracking-tight">Delivery Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Full Name</label>
                <input required type="text" className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="John Doe" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Phone Number</label>
                <input required type="tel" className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="0912 345 6789"
                  onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Delivery Address / Club Name</label>
                <textarea required className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold h-32 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" placeholder="e.g. Pinewoods Table Tennis Club"
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              
              <div className="pt-4">
                <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-4 border border-blue-100">
                  <CreditCard className="text-blue-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Payment Method</p>
                    <p className="text-sm font-bold text-gray-700 uppercase italic">Cash on Delivery / GCash</p>
                  </div>
                </div>
              </div>

              <button 
                disabled={loading || cart.length === 0} 
                type="submit" 
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest mt-6 hover:bg-blue-600 disabled:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-200"
              >
                {loading ? "Processing..." : "Place Order"} <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black uppercase italic mb-6 tracking-tight">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.variation_id}`} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0">
                    <div>
                      <p className="text-xs font-black uppercase italic">{item.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black text-sm text-gray-900">₱{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-6 border-t-2 border-dashed border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Payable</span>
                <span className="text-2xl font-black text-blue-600 italic tracking-tighter">₱{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}