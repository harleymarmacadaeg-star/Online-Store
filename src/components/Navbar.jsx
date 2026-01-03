import { Search, ShoppingCart, X, Settings } from 'lucide-react'; 
import { Link } from 'react-router-dom';

export default function Navbar({ searchTerm, setSearchTerm, cartCount, onCartClick }) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Logo Section - Fixed width to prevent jumping */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="h-15 w-15 overflow-hidden rounded-lg bg-gray-100 border border-gray-100">
            <img src="/HJM.jpg" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic hidden sm:block">
            TABLETENNIS<span className="text-blue-600">SHOP</span>
          </span>
        </Link>

        {/* Search Bar - Flex-1 and centered with proper constraints */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center group">
            <Search className="absolute left-4 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search equipment, apparel..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 pl-11 pr-10 outline-none text-sm font-bold transition-all focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Staff Portal + Cart */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <Link 
            to="/admin/inventory" 
            className="hidden md:flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-tighter mt-0.5">Staff</span>
          </Link>

          {/* Cart Icon */}
          <button 
            onClick={onCartClick} 
            className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95 group"
          >
            <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-blue-600" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </nav>
  );
}