import { useState, useEffect, useCallback } from 'react';
import { CartItem, MenuItem } from '../types';
import { supabase } from "../../../backend/supabaseClient";

const CART_STORAGE_KEY = 'cookie-shop-cart';
const USER_STORAGE_KEY = 'cookie-shop-user';

// ✅ Helper: get customer ID from customers table by email
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
    let latestQuantity = 1;

    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id);
      if (existingItem) {
        latestQuantity = existingItem.quantity + 1;
        return prevCart.map(i =>
          i.id === item.id ? { ...i, quantity: latestQuantity } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });

    // ✅ Use customer_id instead of user_id
    const customerId = await getCustomerId();
    if (customerId) {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          customer_id: customerId,  // 🔑 Foreign key to customers
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: latestQuantity,
          texture: item.texture,
          flavors: item.flavors,
          toppings: (item as any).toppings
        }, { onConflict: 'customer_id, product_id' });

      if (error) console.error("Error syncing to DB:", error.message);
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