import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '../types';
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

  // 🔄 ฟังก์ชันภายในสำหรับล้างข้อมูล QR และ Order ID ค้างจ่าย เมื่อตะกร้ามีการเปลี่ยนแปลง
  const clearPendingOrder = () => {
    localStorage.removeItem("cookie-shop-qr-url");
    localStorage.removeItem("cookie-shop-order-id");
  };

  // จัดการ Sync ตะกร้าสินค้าลง LocalStorage ของเบราว์เซอร์
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // ดึงราคาค่าส่งแบบ Dynamic จากตาราง products หลังตู้
  useEffect(() => {
    const fetchShippingRates = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('item, price')
          .or('item.eq.Shipping Standard (<=10),item.eq.Shipping Bulk (>10)');

        if (data && !error) {
          const standardRate = data.find(p => p.item.includes('Standard'))?.price || 40;
          const bulkRate = data.find(p => p.item.includes('Bulk'))?.price || 50;

          setShippingRates({ standard: standardRate, bulk: bulkRate });
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
    // 💥 ล้างออเดอร์เก่าทันทีหากมีการแอดขนมเพิ่มชิ้นใหม่ (กันเคสยอดเงินเปลี่ยน)
    clearPendingOrder();

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

        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...existingItem,
          price: finalPrice,
          quantity: updatedQuantity
        };
        return newCart;
      } else {
        updatedQuantity = 1;
        return [...prevCart, { ...item, price: finalPrice, quantity: 1 }];
      }
    });

    const customerId = await getCustomerId();
    if (customerId) {
      let flavorArray: string[] = [];
      if (Array.isArray(item.flavor)) {
        flavorArray = item.flavor;
      } else if (item.flavor) {
        flavorArray = [item.flavor as string];
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          customer_id: customerId,
          product_id: item.id,
          name: item.name,
          price: Number(finalPrice),
          quantity: updatedQuantity,
          texture: item.texture || '',
          flavor: flavorArray,
          toppings: item.toppings || [],
          custom_message: item.custom_message || ''
        }, { onConflict: 'customer_id, product_id' });

      if (error) {
        console.error("❌ DB sync error:", error.message);
      }
    }
  };

  const removeFromCart = async (itemId: string) => {
    // 💥 ล้างออเดอร์เก่าทันทีหากผู้ใช้ลบสินค้าออกจากตะกร้า
    clearPendingOrder();

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
    // 💥 ล้างออเดอร์เก่าทันทีหากมีการปรับเพิ่ม/ลดจำนวนชิ้นในตะกร้า
    clearPendingOrder();

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

  const cookieOnlyItems = cart
    .filter(item => !item.name.toLowerCase().includes('topping'))
    .reduce((sum, item) => sum + item.quantity, 0);

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