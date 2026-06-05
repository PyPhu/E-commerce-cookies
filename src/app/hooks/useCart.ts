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

  const [shippingRates, setShippingRates] = useState({ standard: 40, bulk: 50 });

  //จัดการ Sync ตะกร้าสินค้าลง LocalStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // ดึงราคาค่าส่งจากฐานข้อมูลตอนที่ Component ถูกโหลดขึ้นมา (หรือจะเพิ่มปุ่มรีเฟรชก็ได้)
  useEffect(() => {
    const fetchShippingRates = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('item, price')
          // ค้นหาแถวที่มีชื่อตามวิธีที่ 1 (อย่าลืมตั้งชื่อใน DB ให้ตรงกันนะครับ)
          .or('item.eq.Shipping Standard (<=10),item.eq.Shipping Bulk (>10)');

        if (data && !error) {
          const standardRate = data.find(p => p.item.includes('Standard'))?.price || 40;
          const bulkRate = data.find(p => p.item.includes('Bulk'))?.price || 50;

          setShippingRates({ standard: standardRate, bulk: bulkRate });
          console.log("🚚 Fetched shipping rates from DB:", { standard: standardRate, bulk: bulkRate });
        }
      } catch (err) {
        console.error("❌ Failed to fetch shipping rates:", err);
      }
    };

    fetchShippingRates();
  }, []);

  const syncSetCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
  }, []);

  const addToCart = async (item: CartItem) => {
    let updatedQuantity = 1;

    let finalPrice = item.price;
    const isCustom = item.id.includes('custom') || item.type === 'custom' || item.name.toLowerCase().includes('custom');

    if (isCustom) {
      finalPrice = item.toppings && item.toppings.length === 3 ? 409 : 399;
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(i => i.id === item.id);

      if (existingItemIndex !== -1) {
        const existingItem = prevCart[existingItemIndex];
        updatedQuantity = existingItem.quantity + 1;

        console.log(`📦 ${item.name}: ${existingItem.quantity} → ${updatedQuantity}`);

        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...existingItem,
          price: finalPrice,
          quantity: updatedQuantity
        };
        return newCart;
      } else {
        updatedQuantity = 1;
        console.log(`✨ Adding new: ${item.name}`);
        return [...prevCart, { ...item, price: finalPrice, quantity: 1 }];
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
          price: finalPrice,
          quantity: updatedQuantity,
          texture: item.texture || '',
          flavor: Array.isArray(item.flavor) ? item.flavor : (item.flavor ? [item.flavor] : []),
          toppings: item.toppings || [],
          custom_message: item.custom_message || ''
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

  // กรองคัดนับเฉพาะจำนวนชิ้นคุกกี้หลัก (ไม่นับแถวที่เป็น Toppings แยก เพื่อไม่ให้ค่าส่งคำนวณพลาด)
  const cookieOnlyItems = cart
    .filter(item => !item.name.toLowerCase().includes('topping'))
    .reduce((sum, item) => sum + item.quantity, 0);

  // 🌟 ดึงราคาจาก state `shippingRates` มาใช้แทนเลขเดิม
  const shippingFee = cookieOnlyItems === 0
    ? 0
    : (cookieOnlyItems > 10 ? shippingRates.bulk : shippingRates.standard);

  const grandTotal = totalPrice + shippingFee;

  return {
    cart,
    setCart: syncSetCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems: cookieOnlyItems,
    shippingFee,
    grandTotal
  };
}