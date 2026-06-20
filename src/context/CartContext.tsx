import React, { createContext, useContext, useState, useEffect } from 'react';
import { FoodItem, OrderItem } from '../types';

interface CartContextType {
  cartItems: OrderItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('food_order_cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved cart:', err);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('food_order_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: FoodItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.food_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.food_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: 'cart-' + Math.random().toString(36).substr(2, 9),
          food_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (foodId: string) => {
    setCartItems((prev) => prev.filter((i) => i.food_id !== foodId));
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.food_id === foodId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
