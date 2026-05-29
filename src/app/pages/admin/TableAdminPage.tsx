import { useState } from "react";
import { Cookie, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Order } from "../../types";
import { OrderDetailsModal } from "./OrderDetailsModal"; // 🌟 ดึงไฟล์ Modal เข้ามาใช้ที่นี่

interface AdminTablesProps {
  orders: Order[];
  cookieSummary: any[];
  availableProducts: string[];
}

export function AdminTables({ orders, cookieSummary, availableProducts }: AdminTablesProps) {
  const displayList = availableProducts.filter(name => {
    const lowerName = name.toLowerCase();
    return !lowerName.includes("close") && !lowerName.includes("topping");
  });

  if (!displayList.some(name => name.toLowerCase().includes("custom"))) {
    displayList.push("Custom Cookie");
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardName, setSelectedCardName] = useState<string>("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // จัดการเปิดข้อมูลเมื่อคลิกที่การ์ดสถิติ
  const handleCardClick = (productName: string) => {
    setSelectedCardName(productName);
    const isCustomTarget = productName.toLowerCase().includes("custom");

    const filtered = orders.filter(order =>
      order.items.some(item => {
        const itemNameLower = item.name.toLowerCase();
        if (isCustomTarget) return itemNameLower.includes("custom");
        return itemNameLower.includes(productName.toLowerCase());
      })
    );

    setFilteredOrders(filtered);
    setIsModalOpen(true);
  };

  // จัดการเปิดข้อมูลเมื่อคลิกดูรายละเอียดจากตารางหลักด้านล่าง
  const handleOpenSingleOrderModal = (order: Order) => {
    setSelectedCardName(`บิลลูกค้า #${order.id}`);
    setFilteredOrders([order]);
    setIsModalOpen(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders ? orders.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil((orders?.length || 0) / itemsPerPage);

  return (
    <div className="space-y-8">
      {/* ส่วนที่ 1: กล่องสรุปสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayList.map((productName) => {
          const isCustomTarget = productName.toLowerCase().includes("custom");

          let totalPieces = 0;
          if (orders && orders.length > 0) {
            orders.forEach(order => {
              // คัดกรอง: ถ้าจัดส่งสำเร็จ (completed) แล้ว จะไม่นำมานับคำนวณบนหน้าการ์ด
              if (order.status === "completed") return;

              order.items.forEach(item => {
                const itemNameLower = item.name.toLowerCase();
                if (isCustomTarget && itemNameLower.includes("custom")) {
                  totalPieces += item.quantity || 0;
                } else if (!isCustomTarget && itemNameLower === productName.toLowerCase()) {
                  totalPieces += item.quantity || 0;
                }
              });
            });
          }

          return (
            <div key={productName} onClick={() => handleCardClick(productName)} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 flex justify-between items-center cursor-pointer hover:bg-amber-50 hover:scale-[1.01] transition-all">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{productName}</p>
                <p className="text-2xl font-black text-amber-600">
                  {totalPieces} <span className="text-xs text-gray-400 font-normal">pieces</span>
                </p>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg"><Cookie className="w-6 h-6 text-amber-500" /></div>
            </div>
          );
        })}
      </div>

      {/* 🌟 หน้าต่างดึงรายละเอียดและสลับสถานะออเดอร์ */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cardName={selectedCardName}
        filteredOrders={filteredOrders}
        setFilteredOrders={setFilteredOrders} // เก็บตัวนี้ไว้พอ
      />

      {/* ส่วนที่ 2: ตาราง Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl mb-4 font-bold text-amber-900">Orders Table</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead className="bg-gray-50">
              <tr className="border-b text-gray-700 font-semibold">
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-mono text-gray-600">#{order.id}</td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-800">{order.user.name}</div>
                    <div className="text-xs text-gray-500">{order.user.email}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {order.items.map((item: any, idx) => (
                      <div key={idx} className="mb-0.5">
                        <span className="font-medium text-amber-800">{item.quantity}x</span> {item.displayName || item.name}
                      </div>
                    ))}
                  </td>
                  <td className="py-4 px-4 font-bold text-amber-700">฿{order.total.toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === "completed" ? "bg-green-100 text-green-700" :
                      order.status === "preparing" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700" // สำหรับสถานะ paid
                      }`}>
                      {order.status === "completed" ? "Shipped" : order.status === "preparing" ? "Baking" : "Paid"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button onClick={() => handleOpenSingleOrderModal(order)} className="p-2 hover:bg-amber-50 rounded-full text-amber-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className="text-center py-10 text-gray-400">No orders found.</div>}
        </div>

        {/* Pagination Controls */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4 sm:px-6 mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, orders.length)}</span> of <span className="font-medium">{orders.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</div>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}