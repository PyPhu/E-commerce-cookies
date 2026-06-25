import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Mail, CheckCircle, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { UserInfo } from "../../types";
import { supabase } from "../../../../backend/supabaseClient";

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalPrice, shippingFee, clearCart } = useCart();

  // ข้อมูลโปรไฟล์เริ่มต้นเป็นค่าว่าง (จะโหลดจาก Database มาหยอดให้ใน useEffect)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    email: "",
    address: "",
    phone: "",
    role: "user",
  });

  // เปลี่ยนมาเก็บค่าไว้แค่ใน React State ชั่วคราว (ไม่ยุ่งกับ LocalStorage แล้ว)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [orderId, setOrderId] = useState<number | null>(null);

  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [isSubmittingSlip, setIsSubmittingSlip] = useState<boolean>(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  // useEffect ตัวที่ 1: ตรวจสอบ Auth และดึงข้อมูลจาก Supabase ทุกครั้งที่เข้าหน้าเว็บ
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // ถ้าไม่มี Session ตั้งแต่แรก ให้เตือนแล้วดีดกลับหน้า Home ตามต้องการ
      if (!session) {
        toast.error("Please sign in to continue checkout");
        navigate("/", { replace: true });
        return;
      }

      // ดึงข้อมูลลูกค้าจาก Database โดยตรงแบบสดใหม่
      const { data: profile } = await supabase
        .from("customers")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserInfo({
          name: profile.name || "",
          email: profile.email || session.user.email || "",
          phone: profile.phone || "",
          address: profile.address || "",
          role: "user",
        });
      }
    };
    checkAuth();
  }, [navigate]);

  //  ดักฟัง Session Expired ระหว่างเปิดหน้าเว็บทิ้งไว้
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event เกิดขึ้นใน Checkout:", event);

      if (event === 'SIGNED_OUT' || !session) {
        console.log("Session หมดอายุ — กำลังพากลับหน้าหลัก");
        // ล้างข้อมูลโปรไฟล์ใน LocalStorage ที่อาจค้างอยู่จากหน้าอื่นทิ้ง
        localStorage.removeItem("cookie-shop-user");
        
        toast.error("Your session has expired. Returning to homepage.");
        
        navigate("/", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (qrCodeUrl || orderId) {
      toast.error("Order already placed. Please upload the payment slip.");
      return;
    }
    
    if (!userInfo.name || !userInfo.email || !userInfo.address || !userInfo.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGeneratingQr(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired, please sign in again");
        navigate("/", { replace: true });
        return;
      }

      const grandTotal = totalPrice + shippingFee;

      // ส่งข้อมูลให้เพื่อนนำไปปรับปรุงตาม Flow ที่คุยกันไว้
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/create-payment-qr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ cart, userInfo, grandTotal, shippingFee }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // เซฟค่าเก็บไว้แค่ใน React State เพื่อใช้แสดงผลรูป QR ในคอมโพเนนต์เฉยๆ
        setQrCodeUrl(data.qrCodeUrl);
        setOrderId(Number(data.orderId));
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

  const handleSubmitSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) {
      toast.error("Please select your transaction slip image");
      return;
    }
    // ตัวแปรเช็ค orderId เดิม 
    if (!orderId) {
      toast.error("Order ID missing, please try again");
      return;
    }

    setIsSubmittingSlip(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired, please sign in again");
        navigate("/", { replace: true });
        return;
      }

      const slipBase64 = await fileToBase64(slipFile);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-slip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          orderId,
          customerEmail: userInfo.email,
          slip: slipBase64,
          slipFileName: slipFile.name,
          slipFileType: slipFile.type,

        }),
      });

      const data = await res.json();

      if (data.success) {
        // เคลียร์ค่าตะกร้า และไปหน้า success
        await clearCart();
        toast.success("Payment confirmed successfully!");
        navigate("/success", { replace: true });
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
        {/* Delivery Information */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-2xl mb-6">Delivery Information</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={userInfo.name}
                disabled={!!qrCodeUrl}
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
                disabled={true}
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
                placeholder="House number, Street, Subdistrict, District, Province, Postal Code"
              />
            </div>

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

        {/* Order Summary + QR + Slip */}
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
                  <span className="text-gray-700">
                    ฿{(item.price * item.quantity).toFixed(2)}
                  </span>
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
                <span className="text-amber-600">
                  ฿{(totalPrice + shippingFee).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code + Slip Upload */}
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
                support with PromptPay <br />
                total:{" "}
                <b className="text-gray-700">฿{(totalPrice + shippingFee).toFixed(2)}</b>{" "}
                successfully generated <br />
              </p>

              {/* Slip Upload Form */}
              <form
                onSubmit={handleSubmitSlip}
                className="border-t pt-4 text-left space-y-3"
              >
                <label className="block text-sm font-medium text-gray-700">
                  Upload Payment Slip
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSlipFile(e.target.files ? e.target.files[0] : null)
                  }
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