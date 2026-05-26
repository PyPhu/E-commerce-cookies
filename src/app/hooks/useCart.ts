import { useState, useEffect, useCallback } from 'react';
import { CartItem, MenuItem } from '../types';
import { supabase } from "../../../backend/supabaseClient";

const CART_STORAGE_KEY = 'cookie-shop-cart';
const USER_STORAGE_KEY = 'cookie-shop-user';

async function getCustomerId(): Promise<string | null> {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;

  const { email } = JSON.parse(stored);
  if (!email) return null;

  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data.id;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const syncSetCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
  }, []);

  const addToCart = async (item: MenuItem) => {
    let updatedQuantity = 1;

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(i => i.id === item.id);
      
      if (existingItemIndex !== -1) {
        const existingItem = prevCart[existingItemIndex];
        updatedQuantity = existingItem.quantity + 1;
        
        console.log(`📦 ${item.name}: ${existingItem.quantity} → ${updatedQuantity}`);
        
        const newCart = [...prevCart];
        newCart[existingItemIndex] = { ...existingItem, quantity: updatedQuantity };
        return newCart;
      } else {
        updatedQuantity = 1;
        console.log(`✨ Adding new: ${item.name}`);
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });

    const customerId = await getCustomerId();
    if (customerId) {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          customer_id: customerId,
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: updatedQuantity,
          texture: item.texture || '',
          flavor: item.flavor || '',
          toppings: []                  // ✅ Add toppings field
        }, { onConflict: 'customer_id, product_id' });

      if (error) {
        console.error("❌ DB sync error:", error.message);
      } else {
        console.log(`✅ Synced: ${item.name} qty=${updatedQuantity}`);
      }
    }
  };

  const removeFromCart = async (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));

    const customerId = await getCustomerId();
    if (customerId) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customerId)
        .eq('product_id', itemId);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );

    const customerId = await getCustomerId();
    if (customerId) {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('customer_id', customerId)
        .eq('product_id', itemId);
    }
  };

  const clearCart = async () => {
    setCart([]);

    const customerId = await getCustomerId();
    if (customerId) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customerId);
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    setCart: syncSetCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
  };
}