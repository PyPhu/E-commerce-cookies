import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Mail, CheckCircle, Upload } from "lucide-react"; // เพิ่ม Icon สวยๆ สำหรับปุ่มสลิป
import { useState, useEffect } from "react";
import { UserInfo } from "../../types";
import { supabase } from "../../../../backend/supabaseClient";

export function CheckoutPage() {
  const navigate = useNavigate();
  // 🌟 ดึง clearCart เพิ่มเข้ามาเพื่อใช้ล้างตะกร้าตอนจ่ายเสร็จ
  const { cart, totalPrice, shippingFee, clearCart } = useCart();

  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const stored = localStorage.getItem('cookie-shop-user');
    return stored ? JSON.parse(stored) : {
      name: "",
      email: "",
      address: "",
      phone: "",
    };
  });

  // 🌟 เพิ่ม State ใหม่เพื่อรองรับระบบ PromptPay QR และ Slip
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(""); // เก็บภาพ Base64 ของ QR Code
  const [orderId, setOrderId] = useState<string>("");     // เก็บ ID ออเดอร์ที่เจนขึ้นมา
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [isSubmittingSlip, setIsSubmittingSlip] = useState<boolean>(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  // ── Check if user is logged in + pre-fill info from Supabase ──
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue checkout");
        navigate("/login", { replace: true, state: { from: "/checkout" } });
        return;
      }

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

  // 🌟 ฟังก์ชันจังหวะที่ 1: เปลี่ยนจากเปิด Stripe เป็นการเรียก API ของเราเพื่อเจน QR Code
  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInfo.name || !userInfo.email || !userInfo.address || !userInfo.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    localStorage.setItem('cookie-shop-user', JSON.stringify(userInfo));

    setIsGeneratingQr(true); // เปิด Loading ระหว่างรอเจน QR

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired, please sign in again");
        navigate("/login", { state: { from: "/checkout" } });
        return;
      }

      const grandTotal = totalPrice + shippingFee;

      // 🔄 ยิงหา Express Server หลังบ้านของเรา (สมมติว่ารันที่ port 3000)
      const res = await fetch("http://localhost:3000/create-payment-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ส่ง Token ไปเพื่อความปลอดภัย (ถ้าฝั่ง Express หลังบ้านของคุณต้องการแกะเช็กสิทธิ์)
          "Authorization": `Bearer ${session.access_token}`, 
        },
        body: JSON.stringify({
          cart,
          userInfo,
          grandTotal
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl); // เก็บรูปภาพ QR มาแสดงผล
        setOrderId(data.orderId);     // เก็บไอดีออเดอร์ไว้ใช้สเต็ปส่งสลิป
        toast.success("PromptPay QR Generated!");
      } else {
        console.error("QR Generation error:", data);
        toast.error(data.error || "Can't create payment session");
      }
    } catch (error) {
      console.error(error);
      toast.error("Can't connect to server");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // 🌟 ฟังก์ชันจังหวะที่ 2: เมื่อลูกค้าสแกนโอนแล้วแนบไฟล์รูปสลิปส่งมา
  const handleSubmitSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) {
      toast.error("Please select your transaction slip image");
      return;
    }

    setIsSubmittingSlip(true);

    try {
      // 🔄 ยิงบอก Express Server ว่าออเดอร์นี้สลิปมาแล้วนะ ให้ปรับสถานะเป็น paid และล้างตะกร้า
      const res = await fetch("http://localhost:3000/submit-slip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          customerEmail: userInfo.email
        })
      });

      const data = await res.json();

      if (data.success) {
        await clearCart(); // ล้างตะกร้าใน LocalStorage และฝั่ง Supabase
        toast.success("Payment confirmed successfully!");
        navigate("/success", { replace: true }); // พาวิ่งไปหน้าจ่ายเงินสำเร็จ
      } else {
        toast.error(data.error || "Failed to process payment verification");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error communicating with server during slip upload");
    } finally {
      setIsSubmittingSlip(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ฝั่งกรอกข้อมูล */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-2xl mb-6">Delivery Information</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={userInfo.name}
                disabled={!!qrCodeUrl} // ล็อกอินพุตเมื่อเจน QR แล้ว ป้องกันการเปลี่ยนชื่อกลางคัน
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 disabled:bg-gray-100"
                placeholder="Somchai Jaidee"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={userInfo.email}
                disabled={true} // ล็อกอีเมลไว้เสมอเพราะผูกกับ Auth
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                placeholder="somchai@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Phone Number</label>
              <input
                type="text"
                value={userInfo.phone}
                disabled={!!qrCodeUrl}
                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 disabled:bg-gray-100"
                placeholder="081-234-5678"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Address</label>
              <textarea
                value={userInfo.address}
                disabled={!!qrCodeUrl}
                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 disabled:bg-gray-100"
                rows={3}
                placeholder="House number, Street, Subdistrict/Neighborhood, District/City, Province, Postal Code"
              />
            </div>

            {/* ซ่อนปุ่มร้องขอเมื่อได้ QR Code แล้ว */}
            {!qrCodeUrl && (
              <button
                type="submit"
                disabled={isGeneratingQr}
                className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-semibold transition"
              >
                <Mail className="w-5 h-5" />
                {isGeneratingQr ? "Generating QR Code..." : "Place Order & Get PromptPay QR"}
              </button>
            )}
          </form>
        </div>

        {/* ฝั่งสรุปคำสั่งซื้อ และ พื้นที่จ่ายเงิน PromptPay */}
        <div className="space-y-6">
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

          {/* 🌟 ส่วนที่เพิ่มขึ้นมา: กล่องแสดงรูป QR Code และฟอร์มส่งสลิป */}
          {qrCodeUrl && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-amber-500 animate-fade-in space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-lg">
                <CheckCircle className="w-5 h-5" />
                Order Placed! Please Scan to Pay
              </div>
              
              <img 
                src={qrCodeUrl} 
                alt="PromptPay Dynamic QR" 
                className="mx-auto border p-2 bg-gray-50 rounded-lg shadow-sm max-w-[240px]" 
              />
              
              <p className="text-xs text-gray-400">
                สแกนจ่ายได้ด้วยแอปธนาคารทุกแอป <br /> ยอดเงินถูกตั้งค่าไว้ที่ <b className="text-gray-700">฿{(totalPrice + shippingFee).toFixed(2)}</b> เรียบร้อยแล้ว
              </p>

              {/* ฟอร์มส่งสลิป */}
              <form onSubmit={handleSubmitSlip} className="border-t pt-4 text-left space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Payment Slip
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSlipFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                <button
                  type="submit"
                  disabled={isSubmittingSlip}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-semibold transition"
                >
                  <Upload className="w-4 h-4" />
                  {isSubmittingSlip ? "Verifying..." : "Confirm & Send Slip"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}