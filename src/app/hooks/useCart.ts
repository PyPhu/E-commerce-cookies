import { useState, useEffect } from 'react';
import { CartItem, MenuItem } from '../types';
import { supabase } from "../../../backend/supabaseClient";

const CART_STORAGE_KEY = 'cookie-shop-cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Sync with LocalStorage (in case does not Login)
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (item: MenuItem) => {
    // 1. จัดการ Local State ก่อน
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id);
      if (existingItem) {
        return prevCart.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });

    // 2. ถ้า Login อยู่ ให้ส่งไป Supabase ด้วย
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1, // หรือคำนวณจำนวนที่ถูกต้อง
          texture: item.texture,
          flavors: item.flavors
        }, { onConflict: 'user_id, product_id' });
      
      if (error) console.error("Error syncing to DB:", error.message);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));

    // delete in supabase too
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
    // update local
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
    // update in supabase too
    const { data: {user}} = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from ('cart_items')
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
    setCart, // ส่งตัวนี้ออกไปให้ CartPage ใช้ตอน Load ข้อมูลครั้งแรก
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
  };
}
