import { Star } from 'lucide-react'; // Make sure to add this import!

export default function ProductCard({ product, onAddToCart }) {
  const getCategoryColor = (cat) => {
    if (cat === 'Blade') return 'bg-amber-100 text-amber-700';
    if (cat === 'Rubber') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  // Check stock status
  const isOutOfStock = product.stock === 0 || product.stock === null;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getCategoryColor(product.category)}`}>
            {product.category}
          </span>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{product.brand}</span>
        </div>

        {/* --- IMAGE SECTION WITH STOCK LOGIC --- */}
        <div className="mt-4 mb-3 relative h-32 w-full flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
          <img 
            src={product.image_url || 'https://placehold.co/400x400/f3f4f6/3b82f6?text=RJPC+Sport'} 
            alt={product.name}
            className={`h-full w-full object-contain p-2 group-hover:scale-110 transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-40' : ''}`}
            onError={(e) => { e.target.src = 'https://placehold.co/400x400/f3f4f6/3b82f6?text=No+Photo'; }}
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/90 text-gray-900 text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm">
                Out of Stock
              </span>
            </div>
          )}

          {isLowStock && (
            <div className="absolute top-2 left-2">
              <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg animate-pulse">
                Only {product.stock} Left!
              </span>
            </div>
          )}
        </div>
        
        {/* Product Name */}
        <h3 className="mt-2 font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* --- NEW: RATING & SOLD SECTION --- */}
        <div className="flex items-center gap-2 mt-1 mb-2">
          <div className="flex items-center text-yellow-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[11px] font-bold ml-1 text-gray-700">
              {product.rating ? product.rating.toFixed(1) : '5.0'}
            </span>
          </div>
          <span className="text-gray-300 text-xs">|</span>
          <span className="text-[10px] text-gray-500 font-medium">
            {product.sold_count || 0} Sold
          </span>
        </div>

        {/* --- NEW: DESCRIPTION SECTION --- */}
        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed min-h-[32px]">
          {product.description || "Premium table tennis equipment for professional and club play."}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xs font-bold text-blue-600">₱</span>
          <span className="text-xl font-black text-blue-600">
            {product.price ? product.price.toLocaleString() : '---'}
          </span>
        </div>

        <button 
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-2 rounded-xl font-bold text-xs transition-all shadow-md ${
            isOutOfStock 
            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
            : "bg-gray-900 text-white hover:bg-blue-600 active:scale-95"
          }`}
        >
          {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}