import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Package, Phone, MapPin, CheckCircle2, 
  Search, Clock, Truck, X, RefreshCw, AlertTriangle, 
  BarChart3, TrendingUp // <--- FIXED: Explicitly added TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function OrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(null);

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders(); 
      })
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name),
            product_variations (stock_count)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error.message);
    } finally {
      setLoading(false);
      setIsProcessing(null);
    }
  }

  const handleStatusUpdate = async (order, newStatus) => {
    setIsProcessing(order.id);
    const currentStatus = order.status?.toLowerCase();
    const targetStatus = newStatus.toLowerCase();
    try {
      // Syncing inventory using BIGINT logic
      if (targetStatus === 'shipped' && currentStatus === 'pending') {
        for (const item of order.order_items) {
          const v_id = parseInt(item.variation_id); 
          const qty = parseInt(item.quantity);
          const { error: rpcError } = await supabase.rpc('deduct_stock', { p_variation_id: v_id, p_quantity: qty });
          if (rpcError) throw rpcError;
        }
      }
      if (targetStatus === 'cancelled' && (currentStatus === 'shipped' || currentStatus === 'completed')) {
        for (const item of order.order_items) {
          const v_id = parseInt(item.variation_id);
          const qty = parseInt(item.quantity);
          const { error: rpcError } = await supabase.rpc('restore_stock', { p_variation_id: v_id, p_quantity: qty });
          if (rpcError) throw rpcError;
        }
      }
      const { error: updateError } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (updateError) throw updateError;
    } catch (error) {
      console.error("Sync Error:", error);
      alert("Inventory Sync Error: " + error.message);
    } finally {
      setIsProcessing(null);
      fetchOrders();
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  const totalRevenue = orders
    .filter(o => o.status?.toLowerCase() === 'completed' || o.status?.toLowerCase() === 'shipped')
    .reduce((acc, o) => acc + (o.total_amount || 0), 0);

  const pendingCount = orders.filter(o => o.status?.toLowerCase() === 'pending').length;

  const chartData = useMemo(() => {
    const dailyData = {};
    orders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const amount = (o.status?.toLowerCase() === 'completed' || o.status?.toLowerCase() === 'shipped') ? (o.total_amount || 0) : 0;
      dailyData[date] = (dailyData[date] || 0) + amount;
    });
    return Object.keys(dailyData).map(date => ({ date, revenue: dailyData[date] })).reverse().slice(-7);
  }, [orders]);

  const itemCounts = {};
  orders.forEach(o => {
    o.order_items?.forEach(item => {
      const name = item.product_name || item.products?.name;
      if (name) itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
    });
  });
  const topProduct = Object.keys(itemCounts).reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b, 'None');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(o.id).includes(searchTerm);
    const matchesFilter = filterStatus === 'All' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'completed': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-500 border-red-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">Orders <span className="text-blue-600">Feed</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Gear Request Management</p>
            </div>
            <BarChart3 className="text-slate-200 w-12 h-12" />
        </header>

        {/* ANALYTICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-1 grid grid-cols-1 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Revenue</p>
                <h2 className="text-3xl font-black text-blue-600 italic">₱{totalRevenue.toLocaleString()}</h2>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Best Seller</p>
                    <h2 className="text-sm font-black text-slate-800 uppercase truncate w-full">{topProduct}</h2>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl flex-shrink-0 ml-2"><Package className="text-blue-600 w-5 h-5" /></div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Queue Size</p>
                    <h2 className="text-2xl font-black text-amber-500 italic">{pendingCount}</h2>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl"><Clock className="text-amber-500 w-5 h-5" /></div>
            </div>
          </div>
<div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Revenue Performance (7 Days)</h3>
    <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase">
      <TrendingUp className="w-3 h-3"/> Real-time
    </span>
  </div>
  
  {/* Add a fixed height and min-width to the wrapper */}
  <div style={{ width: '100%', height: 200, minWidth: 0 }}> 
    <ResponsiveContainer width="100%" height="100%" debounce={100}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} 
        />
        <YAxis hide />
        <Tooltip 
          cursor={{fill: '#f8fafc'}}
          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: '900', fontSize: '12px' }}
          formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
        />
        <Bar dataKey="revenue" radius={[6, 6, 6, 6]} barSize={35}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563eb' : '#cbd5e1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-200/50 p-4 rounded-[2.5rem]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-bold outline-none shadow-inner"
              placeholder="Search gear or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', 'pending', 'Shipped', 'completed', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  filterStatus === status 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-slate-400 hover:text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <RefreshCw className="w-10 h-10 animate-spin mb-4" />
            <p className="font-black uppercase text-xs tracking-widest">Scanning Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-20">
            {filteredOrders.map(order => {
              const hasInsufficientStock = order.order_items?.some(item => 
                (item.product_variations?.stock_count || 0) < item.quantity
              );

              return (
                <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row">
                  <div className="lg:w-80 p-8 bg-slate-50/50 border-r border-slate-100">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border mb-4 ${getStatusStyle(order.status)}`}>
                      <Clock className="w-3 h-3" /> {order.status}
                    </div>
                    <h3 className="text-xl font-black uppercase italic leading-none mb-4">{order.customer_name}</h3>
                    <div className="space-y-3 text-slate-500">
                      <div className="flex items-center gap-3 text-xs font-bold"><Phone className="w-3.5 h-3.5" />{order.customer_phone}</div>
                      <div className="flex items-start gap-3 text-xs font-bold leading-relaxed"><MapPin className="w-3.5 h-3.5 mt-0.5" />{order.shipping_address}</div>
                    </div>
                  </div>

                  <div className="flex-1 p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Package className="w-4 h-4" /> Ordered Gear</h4>
                      <span className="text-2xl font-black text-blue-600 italic">₱{order.total_amount?.toLocaleString()}</span>
                    </div>

                    <div className="space-y-3 mb-10">
                     {order.order_items?.map((item, idx) => {
  const currentStock = item.product_variations?.stock_count || 0;
  const isOutOfStock = currentStock < item.quantity;
  
  // 1. Calculate the price using fallbacks
  const itemPrice = item.price_at_purchase || item.unit_price || 0;
  const totalItemPrice = itemPrice * item.quantity;

  return (
    <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-xs text-blue-600 border">{item.quantity}x</div>
        <div>
          <p className="text-xs font-black uppercase leading-tight">{item.product_name || item.products?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.variation_name}</p>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase border ${isOutOfStock ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
              {isOutOfStock ? `Out of Stock (${currentStock})` : `Stock: ${currentStock}`}
            </span>
          </div>
        </div>
      </div>
      {/* 2. Display the formatted total item price */}
      <p className="text-xs font-black">₱{totalItemPrice.toLocaleString()}</p>
    </div>
  );
})}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100">
                      {order.status?.toLowerCase() === 'pending' && (
                        <button 
                          disabled={isProcessing === order.id || hasInsufficientStock}
                          onClick={() => handleStatusUpdate(order, 'Shipped')}
                          className={`px-6 py-3 text-white text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2 ${hasInsufficientStock ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-black'}`}
                        >
                          {isProcessing === order.id ? 'Syncing...' : hasInsufficientStock ? <><AlertTriangle className="w-3.5 h-3.5" /> Stock Issue</> : <><Truck className="w-3.5 h-3.5" /> Mark Shipped</>}
                        </button>
                      )}
                      {order.status?.toLowerCase() === 'shipped' && (
                        <button disabled={isProcessing === order.id} onClick={() => handleStatusUpdate(order, 'completed')} className="px-6 py-3 bg-green-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black flex items-center gap-2">
                          {isProcessing === order.id ? 'Syncing...' : <><CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered</>}
                        </button>
                      )}
                      {order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'completed' && (
                        <button disabled={isProcessing === order.id} onClick={() => handleStatusUpdate(order, 'Cancelled')} className="px-6 py-3 bg-white text-slate-400 border border-slate-200 text-[10px] font-black uppercase rounded-xl hover:text-red-500 flex items-center gap-2">
                          {isProcessing === order.id ? '...' : <><X className="w-3.5 h-3.5" /> Cancel</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}