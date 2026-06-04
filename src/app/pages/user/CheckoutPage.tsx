import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { UserInfo } from "../../types";
import { supabase } from "../../../../backend/supabaseClient";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalPrice, shippingFee } = useCart();

  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const stored = localStorage.getItem('cookie-shop-user');
    return stored ? JSON.parse(stored) : {
      name: "",
      email: "",
      address: "",
      phone: "",
    };
  });

  // ── Check if user is logged in + pre-fill info from Supabase ──
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue checkout");
        navigate("/login", { replace: true, state: { from: "/checkout" } });
        return;
      }

      // Pre-fill user info from customers table if exists
      const { data: profile } = await supabase
        .from('customers')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        const loaded: UserInfo = {
          name: profile.name || "",
          email: profile.email || session.user.email || "",
          phone: profile.phone || "",
          address: profile.address || "",
          role: "user"
        };
        setUserInfo(loaded);
      }
    };
    checkAuth();
  }, []);

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInfo.name || !userInfo.email || !userInfo.address || !userInfo.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    localStorage.setItem('cookie-shop-user', JSON.stringify(userInfo));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired, please sign in again");
        navigate("/login", { state: { from: "/checkout" } });
        return;
      }

      // 🌟 2. คำนวณยอดสุทธิรวมค่าส่งตรงนี้เพื่อส่งไปหลังบ้าน
      const grandTotal = totalPrice + shippingFee;

      const res = await fetch(
        "https://uyfprvwjgurtvkpwkzdo.supabase.co/functions/v1/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          // 🌟 3. แนบค่าส่ง และ ยอดรวมสุทธิ ส่งไปให้ Edge Function
          body: JSON.stringify({
            cart,
            userInfo,
            shippingFee,
            grandTotal
          }),
        }
      );

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Edge function error:", data);
        toast.error("can't create payment session");
      }
    } catch (error) {
      console.error(error);
      toast.error("can't connect to payment gateway");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ฝั่งกรอกข้อมูล */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-6">Delivery Information</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="Somchai Jaidee"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="somchai@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                value={userInfo.phone}
                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="081-234-5678"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Address</label>
              <textarea
                value={userInfo.address}
                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                rows={3}
                placeholder="House number, Street, Subdistrict/Neighborhood, District/City, Province, Postal Code"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-semibold"
            >
              <Mail className="w-5 h-5" />
              Pay with PromptPay
            </button>

          </form>
        </div>

        {/* ฝั่งสรุปคำสั่งซื้อ */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-2xl mb-6">Order Summary</h2>
          <div className="space-y-4 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <span className="text-gray-700">฿{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {/* เพิ่มรายละเอียดแยกค่าจัดส่งให้ชัดเจน */}
          <div className="border-t pt-3 space-y-1.5 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Product Price:</span>
              <span>฿{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee:</span>
              <span>฿{shippingFee.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-amber-600">฿{(totalPrice + shippingFee).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}