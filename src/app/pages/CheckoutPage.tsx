import { useState } from "react";
import { useCart } from "../hooks/useCart";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { QrCode, Mail } from "lucide-react";
import { UserInfo } from "../types";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useCart();
  const [showQR, setShowQR] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const stored = localStorage.getItem('cookie-shop-user');
    return stored ? JSON.parse(stored) : {
      name: "",
      email: "",
      address: "",
      phone: "",
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInfo.name || !userInfo.email || !userInfo.address || !userInfo.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    const order = {
      id: `ORDER-${Date.now()}`,
      user: userInfo,
      items: cart,
      total: totalPrice,
      status: "pending" as const,
      createdAt: new Date(),
    };

    const existingOrders = localStorage.getItem('cookie-shop-user-orders');
    const orders = existingOrders ? JSON.parse(existingOrders) : [];
    orders.unshift(order);
    localStorage.setItem('cookie-shop-user-orders', JSON.stringify(orders));

    localStorage.setItem('cookie-shop-user', JSON.stringify(userInfo));

    console.log("Order placed:", order);
    console.log("Email notification would be sent to:", userInfo.email);

    toast.success("Order placed successfully! Check your email for confirmation.");
    clearCart();
    setTimeout(() => navigate("/profile"), 2000);
  };

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-6">Your Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Name</label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                value={userInfo.phone}
                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Delivery Address</label>
              <textarea
                value={userInfo.address}
                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                rows={3}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Place Order & Send Confirmation
            </button>
          </form>

          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full mt-4 border-2 border-amber-600 text-amber-600 py-3 rounded-lg hover:bg-amber-50 flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            {showQR ? "Hide" : "Show"} QR Code for Payment
          </button>

          {showQR && (
            <div className="mt-4 p-6 bg-gray-50 rounded-lg text-center">
              <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Scan to pay ${totalPrice.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="mb-1">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between text-xl">
              <span>Total</span>
              <span className="text-amber-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
