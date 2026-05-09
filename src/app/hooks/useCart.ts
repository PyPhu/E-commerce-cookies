import { useState, useEffect, useCallback } from 'react';
import { CartItem, MenuItem } from '../types';
import { supabase } from "../../../backend/supabaseClient";

const CART_STORAGE_KEY = 'cookie-shop-cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // ใช้ useCallback เพื่อให้ฟังก์ชันไม่ถูกสร้างใหม่ทุกครั้งที่ re-render
  // ป้องกัน infinite loop ใน CartPage
  const syncSetCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
  }, []);

  const addToCart = async (item: MenuItem) => {
    let latestQuantity = 1;

    // 1. Update Local State และหา Quantity ล่าสุดไปพร้อมกัน
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

    // 2. Sync กับ Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: latestQuantity, 
          texture: item.texture,
          flavors: item.flavors
        }, { onConflict: 'user_id, product_id' });
      
      if (error) console.error("Error syncing to DB:", error.message);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', itemId);
    }
  };

  const clearCart = async () => {
    setCart([]);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    setCart: syncSetCart, // ใช้ฟังก์ชันที่ผ่าน useCallback แล้ว
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
  };
}