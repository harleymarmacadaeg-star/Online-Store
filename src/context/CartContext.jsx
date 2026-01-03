import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from local storage on boot
  useEffect(() => {
    const savedCart = localStorage.getItem('rjpc_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('rjpc_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity) => {
    setCart(prev => {
      // Look for exact match of Product ID AND Variation ID
      const existing = prev.find(item => 
        item.id === product.id && item.variation_id === product.variation_id
      );

      if (existing) {
        return prev.map(item =>
          (item.id === product.id && item.variation_id === product.variation_id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId, variationId) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.variation_id === variationId)));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);