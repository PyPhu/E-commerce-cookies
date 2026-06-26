import { X, User, Phone, MapPin, Hash, Receipt, Flame, Truck, Image, Clock, DollarSign, Ban } from "lucide-react"; // 🌟 เพิ่มไอคอน Ban
import { Order } from "../../types";
import { supabase } from "../../../../backend/supabaseClient";
import { toast } from "sonner";
import React from "react";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  filteredOrders: Order[];
  setFilteredOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export function OrderDetailsModal({ isOpen, onClose, cardName, filteredOrders, setFilteredOrders }: OrderDetailsModalProps) {
  // 1. ประกาศ Hooks ไว้ด้านบนสุดให้ครบทั้งหมดเสมอ (ห้ามมี return คั่นกลาง)
  const [activeSlipUrl, setActiveSlipUrl] = React.useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = React.useState("");

  // ซิงค์ trackingNumber เมื่อข้อมูล filteredOrders เปลี่ยนแปลง
  React.useEffect(() => {
    if (filteredOrders && filteredOrders[0]) {
      setTrackingNumber(filteredOrders[0].trackingNumber || "");
    }
  }, [filteredOrders]);

  // 2. ย้ายเงื่อนไขตรวจสอบการเปิด/ปิด Modal มาไว้ตรงนี้ (หลังจากเคลียร์ Hook ครบ)
  if (!isOpen) return null;

  // 3. ฟังก์ชันการทำงานอื่นๆ เหมือนเดิม...
  const handleUpdateStatus = async (orderId: string, newStatus: "pending" | "paid" | "preparing" | "ready" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", parseInt(orderId));

      if (error) throw error;

      toast.success(`อัปเดตสเตตัสออเดอร์ #${orderId} เรียบร้อยแล้ว`);

      setFilteredOrders(prev =>
        prev.map(order => order.id === orderId ? { ...order, status: newStatus as any } : order)
      );

      filteredOrders.forEach(order => {
        if (order.id === orderId) {
          order.status = newStatus as any;
        }
      });

    } catch (err: any) {
      console.error(err);
      toast.error("can't change status: " + err.message);
    }
  };

  const handleTrackingNumberChange = async (orderId: string, newTrackingNumber: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ tracking_number: newTrackingNumber })
        .eq("id", parseInt(orderId));

      if (error) throw error;

      toast.success(`อัปเดตหมายเลขติดตามออเดอร์ #${orderId} เรียบร้อยแล้ว`);

      setFilteredOrders(prev =>
        prev.map(order => order.id === orderId ? { ...order, trackingNumber: newTrackingNumber } : order)
      );

    } catch (err: any) {
      console.error(err);
      toast.error("can't update tracking number: " + err.message);
    }
  };

  const handleShowSlip = async () => {
    if (filteredOrders.length > 0) {
      const slipUrl = (filteredOrders[0] as any).slipUrl;
      if (slipUrl) {
        const signedUrl = await supabase.storage.from('e-slips').createSignedUrl(slipUrl, 600);
        if (signedUrl.data && signedUrl.data.signedUrl) {
          setActiveSlipUrl(signedUrl.data.signedUrl);
        } else {
          console.error('Failed to create signed URL', signedUrl.error);
          toast.error('Failed to load slip image.');
        }
      }
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
                  <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border shadow-sm">
                    <span className="text-xs text-gray-400 font-bold px-2">Status:</span>

                    <button
                      onClick={() => handleUpdateStatus(order.id, "pending")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "pending" ? "bg-gray-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <Clock className="w-3 h-3" /> Pending
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, "paid")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "paid" ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <DollarSign className="w-3 h-3" /> Paid
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, "preparing")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "preparing" ? "bg-blue-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <Flame className="w-3 h-3" /> Baking
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, "completed")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "completed" ? "bg-green-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <Truck className="w-3 h-3" /> Shipped
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, "cancelled")}
                      className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${(order.status as string) === "cancelled" ? "bg-red-500 text-white shadow-sm" : "text-gray-400 hover:bg-red-50 hover:text-red-500"}`}
                    >
                      <Ban className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>

                <div className="p-4 grid md:grid-cols-2 gap-6">
                  {/* ข้อมูลลูกค้า */}
                  <div className="space-y-2.5 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4 flex flex-col justify-between">
                    <div className="space-y-2.5">
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
                      
                      <div className="flex items-center gap-1 text-gray-500 pt-2"><Hash className="w-3 h-3" /> Tracking Number</div>
                      <div className="p-2 rounded-lg border text-sm bg-gray-50 border-gray-100 flex gap-2">
                        <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full bg-transparent text-gray-600 text-xs font-mono focus:outline-none" placeholder="No tracking number" />
                        <button onClick={() => handleTrackingNumberChange(order.id, trackingNumber)} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] rounded-md transition-colors flex-shrink-0 font-bold">
                          Update
                        </button>
                      </div>
                    </div>

                    {/* ส่วนสำหรับแสดงการตรวจสอบ E-Slip เงินโอน ยึดข้อมูลจาก slip_url */}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Receipt</h4>
                      {(order as any).slipUrl ? (
                        <button 
                          onClick={handleShowSlip}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-medium text-xs transition-all shadow-sm group"
                        >
                          <Image className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                          Click to view payment receipt (E-Slip)
                        </button>
                      ) : (
                        <div className="text-center p-3 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                          Don't have a slip URL for this order.
                        </div>
                      )}
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
                                {item.texture && <div>• texture: {item.texture}</div>}
                                {item.flavor && <div>• flavor: {Array.isArray(item.flavor) ? item.flavor.join(", ") : item.flavor}</div>}
                                {item.toppings && item.toppings.length > 0 && (
                                  <div>• toppings: {Array.isArray(item.toppings) ? item.toppings.join(", ") : item.toppings}</div>
                                )}
                                {item.custom_message && (
                                  <div className="mt-1 p-2 bg-amber-50 border border-amber-200 text-amber-700 rounded text-pretty break-words whitespace-pre-wrap">
                                    <span className="font-medium">Card Message: </span>{item.custom_message}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <div className="flex items-center gap-1 text-gray-500"><Receipt className="w-4 h-4" />Shipping Fee:</div>
                        <span className="text-base text-amber-700">฿{order.shippingPrice!.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <div className="flex items-center gap-1 text-gray-500"><Receipt className="w-4 h-4" /> Total Amount:</div>
                        <span className="text-base text-amber-700">฿{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/*  Footer  */}
        <div className="border-t p-2 bg-gray-50 rounded-b-2xl" />

      </div>

      {/* Nested Modal: แสดงภาพ E-Slip */}
      {activeSlipUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="relative max-w-md w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveSlipUrl(null)}
              className="absolute -top-12 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" /> ปิดรูปภาพ
            </button>
            <img 
              src={activeSlipUrl} 
              alt="Payment Slip" 
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}