import { useState, useEffect } from "react";
import { UserInfo, Order } from "../../types";
import { User, Package, MapPin, Mail, Phone, Edit2, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../backend/supabaseClient";
import { useNavigate } from "react-router";

const USER_STORAGE_KEY = 'cookie-shop-user';

export function UserProfilePage() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/login");
  };

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

  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const hasProfile = userInfo.name && userInfo.email;

  useEffect(() => {
    async function fetchOrderHistory() {
      if (!userInfo.email) return;

      setIsLoadingOrders(true); // เปิดเอฟเฟกต์หมุน ๆ โหลดข้อมูล

      try {
        // pull id from email
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', userInfo.email)
          .single();

        if (customerError || !customerData) {
          setIsLoadingOrders(false);
          return;
        }

        const customerId = customerData.id;

        // pull order 
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, status')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // ถ้าลูกค้าคนนี้ยังไม่เคยสั่งซื้ออะไรเลย ให้หยุดทำงานตรงนี้
        if (!ordersData || ordersData.length === 0) {
          setUserOrders([]);
          setIsLoadingOrders(false);
          return;
        }

        // รวบรวม Order ID ทั้งหมดออกมาเป็นอาเรย์ เช่น [10, 11, 12] เพื่อไปหาของต่อ
        const orderIds = ordersData.map(order => order.id);

        // pull order_items 
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, order_id, texture, flavor, toppings, quantity')
          .in('order_id', orderIds); // ค้นหาไอเทมทั้งหมดที่อยู่ในรายการออเดอร์ชุดนี้

        if (itemsError) throw itemsError;

        // combine order and order_items 
        const combinedOrders = ordersData.map(order => {
          return {
            ...order,
            // select a match id
            order_items: itemsData ? itemsData.filter(item => item.order_id === order.id) : []
          };
        });

        setUserOrders(combinedOrders);

      } catch (err: any) {
        console.error("Error fetching orders manually:", err);
        toast.error("Could not load order history");
      } finally {
        setIsLoadingOrders(false); 
      }
    }

    fetchOrderHistory();
  }, [userInfo.email]); 


  const handleSave = async () => {
    if (!editedInfo.name || !editedInfo.email || !editedInfo.address || !editedInfo.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .from('customers')
      .upsert({
        name: editedInfo.name,
        email: editedInfo.email,
        phone: editedInfo.phone,
        address: editedInfo.address,
      }, { onConflict: 'email' });

    if (error) {
      toast.error("Failed to save profile: " + error.message);
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
        {/*(Personal Info)*/}
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
                  onClick={() => handleClick()}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                >
                  Login
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

        {/*(Order History)*/}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl mb-6">Order History</h2>

            {/* load data from Supabase */}
            {isLoadingOrders ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                <p>Loading your orders...</p>
              </div>
            ) : userOrders.length === 0 ? (
              /* no order found */
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No orders yet</p>
                <p className="text-sm text-gray-500">Your order history will appear here</p>
              </div>
            ) : (
              /* has order then loop order's card */
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {/* order.id from orders */}
                        <p className="text-sm text-gray-600 font-bold">Order ID: #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {/* นำเวลา timestamptz (created_at) มาแปลงให้เป็นภาษาอ่านง่าย */}
                          {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 font-bold">Order ID: #{order.id}</p> 
                      <span
                        className={`px-3 py-1 rounded-full text-sm capitalize font-bold ${ 
                          order.status === "shipped"
                            ? "bg-green-100 text-green-700"
                            : order.status === "prepare"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "paid"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700" /* 👈 จะเข้าเงื่อนไขสีเทานี้อัตโนมัติเมื่อสถานะเป็น "pending" */
                          }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* รายการคุกกี้ในออเดอร์ (ดึงจาก order_items ที่เราฟิลเตอร์ไว้) */}
                    <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
                      {order.order_items && order.order_items.map((item: any, index: number) => (
                        <div key={index} className="text-sm flex flex-col border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                          <div className="flex justify-between text-gray-800">
                            <span className="font-semibold text-amber-800">
                              {item.quantity}x Custom Cookie ({item.flavor || "Original"})
                            </span>
                          </div>

                          {/* โชว์รายละเอียด (item.flavor) */}
                          {(item.texture || item.flavor || item.toppings) && (
                            <div className="text-xs text-gray-500 mt-1 pl-3 space-y-0.5">
                              {item.texture && <p>• Texture: {item.texture}</p>}
                              {item.toppings && (
                                <p>• Toppings: {Array.isArray(item.toppings) ? item.toppings.join(', ') : item.toppings}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
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