import { useState, useEffect } from "react";
import { Loader2, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../../../backend/supabaseClient";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface OrderHistoryProps {
  email: string;
}

export function OrderHistory({ email }: OrderHistoryProps) {
  const ITEM_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrderHistory() {
      if (!email) return;

      setIsLoadingOrders(true);

      try {
        // ดึง customer_id จาก email
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .single();

        if (customerError || !customerData) {
          setIsLoadingOrders(false);
          return;
        }

        const customerId = customerData.id;
        const from = (currentPage - 1) * ITEM_PAGE;
        const to = from + ITEM_PAGE - 1;

        // ดึงรายการ orders ของลูกค้ารายนี้
        const { data: ordersData, error: ordersError, count } = await supabase
          .from('orders')
          .select('id, created_at, status, tracking_number, price_paid, shipping_price', { count: 'exact' })
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (!ordersData || ordersData.length === 0) {
          setUserOrders([]);
          setIsLoadingOrders(false);
          return;
        }

        if (count !== null) {
          setTotalOrders(count);
        }

        if (ordersError) throw ordersError;

        const orderIds = ordersData.map(order => order.id);

        // ดึงรายการสินค้า (order_items) ที่คู่กับออเดอร์ชุดนี้
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, order_id, texture, flavor, toppings, quantity, name, price, custom_message')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // รวมออเดอร์กับรายการสินค้าเข้าด้วยกัน
        const combinedOrders = ordersData.map(order => {
          return {
            ...order,
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
  }, [email, currentPage]);

  // end session supabase
  useEffect(() => {
    // ดักฟัง Event ตลอดเวลา
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // ลบข้อมูลใน LocalStorage 
        localStorage.removeItem("cookie-shop-user");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const totalPages = Math.ceil(totalOrders / ITEM_PAGE);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl mb-6">Order History</h2>

      {isLoadingOrders ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p>Loading your orders...</p>
        </div>
      ) : userOrders.length === 0 ? (
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
                  <p className="text-sm text-gray-600 font-bold">Order ID: #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                  {order.tracking_number && (
                    <p className="text-sm text-gray-500 mt-1">Tracking Number of KEX express: {order.tracking_number}</p>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs capitalize font-bold ${
                    order.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : order.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : order.status === "preparing"
                      ? "bg-blue-100 text-blue-700"
                      : order.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {order.status === "cancelled" 
                    ? "Cancelled" 
                    : order.status === "completed" 
                    ? "Shipped" 
                    : order.status === "preparing" 
                    ? "Baking" 
                    : order.status === "paid" 
                    ? "Paid" 
                    : "Pending"}
                </span>
              </div>

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
                  <span className="text-amber-800">฿{order.shipping_price ?? 0}</span>
                  <span>Total Paid:</span>
                  <span className="text-amber-800">฿{order.price_paid ?? 0}</span>
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
  );
}