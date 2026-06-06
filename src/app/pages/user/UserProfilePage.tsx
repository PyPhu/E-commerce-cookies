import { useState, useEffect } from "react";
import { UserInfo, Order } from "../../types";
import { User, Package, MapPin, Mail, Phone, Edit2, Save, X, Loader2, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../backend/supabaseClient";
import { useNavigate } from "react-router";

const USER_STORAGE_KEY = 'cookie-shop-user';

export function UserProfilePage() {
  const navigate = useNavigate();

  const ITEM_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0); // เก็บจำนวนออเดอร์ทั้งหมดที่ดึงได้จากเบส

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

        const from = (currentPage - 1) * ITEM_PAGE;
        const to = from + ITEM_PAGE - 1;

        // pull order 
        const { data: ordersData, error: ordersError, count } = await supabase
          .from('orders')
          .select('id, created_at, status, tracking_number, price_paid, shipping_price', { count: 'exact' }) // ขอ count มาด้วยเลย
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .range(from, to);

        // ถ้าลูกค้าคนนี้ยังไม่เคยสั่งซื้ออะไรเลย ให้หยุดทำงานตรงนี้
        if (!ordersData || ordersData.length === 0) {
          setUserOrders([]);
          setIsLoadingOrders(false);
          return;
        }

        if (count !== null) {
          setTotalOrders(count);
        }

        if (ordersError) throw ordersError;

        // รวบรวม Order ID ทั้งหมดออกมาเป็นอาเรย์ เช่น [10, 11, 12] เพื่อไปหาของต่อ
        const orderIds = ordersData.map(order => order.id);

        // pull order_items 
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, order_id, texture, flavor, toppings, quantity, name, price, custom_message')
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
  }, [userInfo.email, currentPage]);

  const totalPages = Math.ceil(totalOrders / ITEM_PAGE);

  const handleSave = async () => {
    if (!editedInfo.name || !editedInfo.email || !editedInfo.address || !editedInfo.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    const { error } = await supabase
      .from('customers')
      .update({
        name: editedInfo.name,
        email: editedInfo.email,
        phone: editedInfo.phone,
        address: editedInfo.address,
      })
      .eq('id', user.id);

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

  const handleLogout = async () => {
    try {
      // log out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error("Logout failed: " + error.message);
        return;
      }

      // clear localStorage
      localStorage.removeItem("cookie-shop-user");

      toast.success("Logged out successfully");
      navigate("/login");

    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
    }
  };


  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold">My Profile</h1>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border border-black-200 bg-amber-300 hover:bg-amber-400 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

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
          {/* Developer Profile*/}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Developer Profile</h3>
                <p className="text-xs text-gray-500">student from kmitl</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex justify-between">
                <span className="text-gray-500">Developed by:</span>
                <span className=" text-gray-500">Phurin</span>
              </p>
              <p><span className="flex justify-end text-gray-500">Krissada</span></p>
              <p><span className="flex justify-end text-gray-500">Sopolwit</span></p>
              <p className="flex justify-between">
                <span className="text-gray-500">Role:</span>
                <span className="text-amber-500 font-medium">Full-Stack Developer</span>
              </p>
              <p className="text-xs text-gray-400 border-t border-gray-50 pt-2 mt-2 text-center">
                © {new Date().getFullYear()} Cookie Shop Project.
              </p>
            </div>
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
                        <p className="text-sm text-gray-600 font-bold">Order ID: #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                        {order.tracking_number && (
                          <p className="text-sm text-gray-500 mt-1">Tracking Number: {order.tracking_number}</p>
                        )}
                      </div>

                      {/* 🌟 ปรับปรุงส่วนการเช็คสเตตัสและจับคู่สีสันให้ตรงกับฝั่งแอดมิน */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs capitalize font-bold ${order.status === "completed"
                          ? "bg-green-100 text-green-700" // Shipped
                          : order.status === "preparing"
                            ? "bg-blue-100 text-blue-700"  // Baking
                            : "bg-amber-100 text-amber-700" // Paid
                          }`}
                      >
                        {order.status === "completed" ? "Shipped" : order.status === "preparing" ? "Baking" : "Paid"}
                      </span>
                    </div>

                    {/* รายการคุกกี้ในออเดอร์ */}
                    <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
                      {order.order_items && order.order_items.map((item: any, index: number) => (
                        <div key={index} className="text-sm flex flex-col border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                          <div className="flex justify-between text-gray-800">
                            <span className="font-semibold text-amber-800">
                              {item.quantity}x {item.name}
                            </span>
                            <p className="font-semibold text-amber-800">{item.price * item.quantity}</p>
                          </div>

                          {(item.texture || item.flavor || item.toppings) && (
                            <div className="text-xs text-gray-500 mt-1 pl-3 space-y-0.5">
                              {item.texture && <p>• Texture: {item.texture}</p>}
                              {item.flavor && <p>• Flavor: {Array.isArray(item.flavor) ? item.flavor.join(', ') : item.flavor}</p>}
                              {item.toppings && (
                                <p>• Toppings: {Array.isArray(item.toppings) ? item.toppings.join(', ') : item.toppings}</p>
                              )}
                              {item.custom_message && (
                                <p className="text-pretty break-words whitespace-pre-wrap w-[200px]">• Note: {item.custom_message}</p>
                               )}
                            </div>
                          )}
                        </div> 
                      ))}
                      <div className="border-t pt-2 mt-2 flex justify-start gap-4 text-sm">
                        <span>Shipping fee:</span>
                        <span className="text-amber-800">
                          ฿{order.shipping_price ?? 0 }
                        </span>
                        <span>Total Paid:</span>
                        <span className="text-amber-800">
                          ฿{order.price_paid ?? 0}
                        </span>
                      </div>
                    </div>

                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                    <p className="text-sm text-gray-600">
                      Showing page <span className="font-semibold">{currentPage}</span> of{" "}
                      <span className="font-semibold">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border rounded-lg disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border rounded-lg disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}