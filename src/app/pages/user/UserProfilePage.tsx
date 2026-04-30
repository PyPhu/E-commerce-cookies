import { useState, useEffect } from "react";
import { UserInfo, Order } from "../../types";
import { User, Package, MapPin, Mail, Phone, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

const USER_STORAGE_KEY = 'cookie-shop-user';
const ORDERS_STORAGE_KEY = 'cookie-shop-user-orders';

export function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      name: "",
      email: "",
      address: "",
      phone: "",
    };
  });
  const [editedInfo, setEditedInfo] = useState<UserInfo>(userInfo);
  const [userOrders, setUserOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    return stored ? JSON.parse(stored).map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt)
    })) : [];
  });

  const hasProfile = userInfo.name && userInfo.email;

  const handleSave = () => {
    if (!editedInfo.name || !editedInfo.email || !editedInfo.address || !editedInfo.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    setUserInfo(editedInfo);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(editedInfo));
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">Personal Info</h2>
              {hasProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-amber-600 hover:text-amber-700 p-2"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {!hasProfile && !isEditing ? (
              <div className="text-center py-8">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No profile information yet</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                >
                  Create Profile
                </button>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={editedInfo.name}
                    onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={editedInfo.email}
                    onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editedInfo.phone}
                    onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Address</label>
                  <textarea
                    value={editedInfo.address}
                    onChange={(e) => setEditedInfo({ ...editedInfo, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    rows={3}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  {hasProfile && (
                    <button
                      onClick={handleCancel}
                      className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p>{userInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p>{userInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p>{userInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p>{userInfo.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl mb-6">Order History</h2>

            {userOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No orders yet</p>
                <p className="text-sm text-gray-500">Your order history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                        <p className="text-sm text-gray-600">
                          {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm capitalize ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : order.status === "ready"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "preparing"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 flex justify-between">
                      <span>Total</span>
                      <span className="text-amber-600">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
