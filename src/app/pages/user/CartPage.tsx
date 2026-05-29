import { useCart } from "../../hooks/useCart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "../../../../backend/supabaseClient";
import { useEffect, useState } from "react";

export function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems, setCart } = useCart();

  useEffect(() => {
    const loadCartData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq('customer_id', user.id);

      if (data && data.length > 0) {
        const formattedCart = data.map((item: any) => ({
          ...item,
          id: item.product_id, // Map product_id กลับมาเป็น id ให้ตรงกับ Interface ของเรา
        }));
        setCart(formattedCart);
      }
    };
    loadCartData();
  }, [setCart]);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious cookies to get started!</p>
          <button
            onClick={() => navigate("/")}
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  //pull data from supabase and display it in the cart page
  // 1. ฟังก์ชันดึงข้อมูล (ดึง userId ภายในฟังก์ชัน)
  const fetchCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq('customer_id', user.id);

    if (error) throw error;
    return data;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">Shopping Cart</h1>

      <div className="bg-white rounded-lg shadow-md mb-6">
        {cart.map((item) => (
          <div
  key={item.id}
  className="p-6 border-b last:border-b-0 flex flex-row items-center justify-between gap-6"
>
  {/* ฝั่งซ้าย: รวมชื่อ รายละเอียด และปุ่มเพิ่ม/ลดไว้ด้วยกันแบบแนวตั้ง (flex-col) */}
  <div className="flex-1 min-w-0 flex flex-col gap-4">
    <div>
      <h3 className="text-lg mb-1 font-medium">{item.name}</h3>
      <p className="text-gray-600 text-sm capitalize">
        {item.texture} • {item.flavor} • {item.toppings?.join(", ")}
      </p>
    </div>

    {/* ปุ่มเพิ่ม/ลดจำนวน อยู่ด้านล่างรายละเอียดสินค้า */}
    <div className="flex items-center gap-3">
      <button
        onClick={() => updateQuantity(item.id, item.quantity - 1)}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center font-medium">{item.quantity}</span>
      <button
        onClick={() => updateQuantity(item.id, item.quantity + 1)}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>

  {/* ฝั่งขวา: ราคากับปุ่มลบสินค้า */}
  <div className="flex items-center gap-4 shrink-0">
    <div className="text-right">
      <span className="text-lg ">
        ฿{(item.price * item.quantity).toFixed(2)}
      </span>
    </div>
    <button
      onClick={() => removeFromCart(item.id)}
      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
      title="ลบสินค้า"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  </div>
</div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <p className="text-gray-600">Total Items: {totalItems}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-gray-600 text-sm mb-1">Total</p>
            <p className="text-3xl text-amber-600">฿{totalPrice.toFixed(2)}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
