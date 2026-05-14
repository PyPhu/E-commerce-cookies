import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { QrCode, Mail } from "lucide-react";
import { useState } from "react";
import { UserInfo } from "../../types";
import { useEffect } from "react";
import { supabase } from "../../../../backend/supabaseClient";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalPrice } = useCart();

    // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue checkout");
        navigate("/login");
      }
    };
    checkAuth();
  }, []);

  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const stored = localStorage.getItem('cookie-shop-user');
    return stored ? JSON.parse(stored) : {
      name: "",
      email: "",
      address: "",
      phone: "",
    };
  });

const handleCheckout = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();

  if (!userInfo.name || !userInfo.email || !userInfo.address || !userInfo.phone) {
    toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  localStorage.setItem('cookie-shop-user', JSON.stringify(userInfo));

  try {
    // 1. Get customer_id from customers table
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', userInfo.email)
      .single();

    if (customerError || !customer) {
      toast.error("ไม่พบข้อมูลลูกค้า กรุณาบันทึกโปรไฟล์ก่อน");
      navigate("/profile");
      return;
    }

    // 2. Create order → get order id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,   // 🔑 FK to customers
        status: 'pending',
        total: totalPrice,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      toast.error("เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      return;
    }

    // 3. Transfer cart → order_items using order.id as FK
    const orderItems = cart.map((item) => ({
      order_id: order.id,           // 🔑 FK to orders
      cookie_type: item.name,
      flavor: item.flavors?.[0] ?? null,
      toppings: item.flavors ?? [],
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกรายการสินค้า");
      return;
    }

    // 4. Clear cart from Supabase
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', customer.id);

    // 5. Redirect to Stripe (pass order_id for tracking)
    const res = await fetch("http://localhost:3000/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, orderId: order.id }),  // send orderId to backend
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      toast.error("เกิดข้อผิดพลาดในการสร้างรายการชำระเงิน");
    }

  } catch (error) {
    console.error(error);
    toast.error("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
  }
};

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ฝั่งกรอกข้อมูล */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-6">ข้อมูลการจัดส่ง</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="สมชาย ใจดี"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">อีเมล</label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="somchai@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={userInfo.phone}
                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="081-234-5678"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">ที่อยู่จัดส่ง</label>
              <textarea
                value={userInfo.address}
                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                rows={3}
                placeholder="เลขที่บ้าน, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-semibold"
            >
              <Mail className="w-5 h-5" />
              ชำระเงินด้วย PromptPay
            </button>

            {/* สำหรับเทสการยกเลิกการชำระเงิน (ลบออกได้หลังจากทดสอบ) */}
            // ใน CheckoutPage.tsx (ใส่ไว้ชั่วคราวเพื่อเทส)
            <button
              onClick={() => window.location.href = '/cancel'}
              className="text-sm text-gray-400 underline"
            >
              Test: Simulate Cancel Payment
            </button>
          </form>
          
        </div>

        {/* ฝั่งสรุปคำสั่งซื้อ */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-2xl mb-6">สรุปคำสั่งซื้อ</h2>
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="mb-1 font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">จำนวน: {item.quantity}</p>
                </div>
                <span>฿{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>ยอดรวมสุทธิ</span>
              <span className="text-amber-600">฿{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}