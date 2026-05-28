import { X, User, Phone, MapPin, Hash, Receipt, Flame, Truck } from "lucide-react";
import { Order } from "../../types";
import { supabase } from "../../../../backend/supabaseClient";
import { toast } from "sonner";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  filteredOrders: Order[];
  setFilteredOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export function OrderDetailsModal({ isOpen, onClose, cardName, filteredOrders, setFilteredOrders }: OrderDetailsModalProps) {
  if (!isOpen) return null;

  const handleUpdateStatus = async (orderId: string, newStatus: "paid" | "preparing" | "ready" | "completed") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", parseInt(orderId));

      if (error) throw error;

      toast.success(`อัปเดตสเตตัสออเดอร์ #${orderId} เรียบร้อยแล้ว`);

      // 1. อัปเดตสถานะให้ UI ของตัวแปรกลุ่มที่แสดงอยู่ใน Modal เปลี่ยนตามสด ๆ
      setFilteredOrders(prev =>
        prev.map(order => order.id === orderId ? { ...order, status: newStatus as any } : order)
      );

      // 2. ซิงค์ค่าย้อนกลับไปหาออบเจกต์ด้านนอกตารางทันที
      filteredOrders.forEach(order => {
        if (order.id === orderId) {
          order.status = newStatus as any;
        }
      });

    } catch (err: any) {
      console.error(err);
      toast.error("ไม่สามารถเปลี่ยนสเตตัสได้: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center border-b p-6 bg-amber-50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-black text-amber-900">{cardName}</h3>
            <p className="text-xs text-amber-700 mt-0.5">found {filteredOrders.length} orders</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-200/50 rounded-full text-amber-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders found for this item.</p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Meta Header */}
                <div className="bg-gray-100/70 px-4 py-3 border-b flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm font-bold font-mono text-gray-700">
                    <Hash className="w-4 h-4 text-gray-400" /> #{order.id}
                  </div>

                  {/* แถบเปลี่ยนสถานะ */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border shadow-sm">
                    <span className="text-xs text-gray-400 font-bold px-2">Status:</span>

                    {/* ปุ่มที่ 1: เปลี่ยนจาก waiting เป็น Paid */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, "paid")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "paid" ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      Paid
                    </button>

                    {/* ปุ่มที่ 2: preparing */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, "preparing")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "preparing" ? "bg-blue-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      <Flame className="w-3 h-3" /> Baking
                    </button>

                    {/* ปุ่มที่ 3: completed */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, "completed")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "completed" ? "bg-green-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      <Truck className="w-3 h-3" /> Shipped
                    </button>
                  </div>
                </div>

                <div className="p-4 grid md:grid-cols-2 gap-6">
                  {/* ข้อมูลลูกค้า */}
                  <div className="space-y-2.5 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">shipped info</h4>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <User className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div><span className="font-semibold">{order.user.name}</span> <span className="text-xs text-gray-400">({order.user.email})</span></div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>{order.user.phone || "No telephone number"}</div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs leading-relaxed">{order.user.address || "No address available"}</div>
                    </div>
                  </div>

                  {/* รายการสินค้าในบิล */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">all order items</h4>
                      <div className="space-y-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-lg border text-sm bg-gray-50 border-gray-100">
                            <div className="flex justify-between font-medium">
                              <span className="text-gray-800"><span className="text-amber-700 font-bold">{item.quantity}x</span> {item.name}</span>
                              <span className="text-gray-500">฿{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {(item.texture || item.flavor || (item.toppings && item.toppings.length > 0)) && (
                              <div className="text-xs text-gray-400 mt-1 pl-5 border-l-2 border-dashed border-amber-300 ml-1 space-y-0.5">
                                {item.texture && <div>• เนื้อคุกกี้: {item.texture}</div>}
                                {item.flavor && <div>• รสชาติ: {item.flavor}</div>}
                                {item.toppings && item.toppings.length > 0 && (
                                  <div>• ท็อปปิ้ง: {Array.isArray(item.toppings) ? item.toppings.join(", ") : item.toppings}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-bold">
                      <div className="flex items-center gap-1 text-gray-500"><Receipt className="w-4 h-4" /> Total Amount:</div>
                      <span className="text-base text-amber-700">฿{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            close window
          </button>
        </div>

      </div>
    </div>
  );
}