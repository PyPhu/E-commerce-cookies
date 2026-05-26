import { Cookie, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Order } from "../../types";
import { useState } from "react"; // 🟢 อย่าลืมอิมพอร์ต useState เข้ามาด้วยนะครับ


interface AdminTablesProps {
  orders: Order[];
  cookieSummary: any[];
  availableProducts: string[]; // 🌟 รับรายชื่อสินค้าจริงที่ดึงมาจาก Product Table
}

export function AdminTables({ orders, cookieSummary, availableProducts }: AdminTablesProps) {
  
  // 🌟 รวมรายชื่อที่จะนำมาแสดง: เริ่มจากสินค้าสำเร็จรูปในร้าน + ตรวจสอบว่าในออเดอร์มี Custom Cookie ด้วยไหม
  const displayList = [...availableProducts];
  
  const hasCustomCookieInOrders = cookieSummary.some(
    (c) => c.name.toLowerCase().includes("custom")
  );
  
  // ถ้าในระบบออเดอร์มีคนสั่งคุกกี้สั่งทำพิเศษ ให้งอกกล่องสรุปผล Custom Cookie เพิ่มมาอัตโนมัติ
  if (hasCustomCookieInOrders && !displayList.some(name => name.toLowerCase().includes("custom"))) {
    displayList.push("Custom Cookie");
  }

  // 1. ตั้ง State สำหรับจัดการเรื่องหน้าปัจจุบัน
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // จำกัดให้แสดงหน้าละ 10 รายการ

  // 2. คำนวณหาตำแหน่ง Index สำหรับการตัดแบ่งอาร์เรย์ข้อมูล
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // 3. ตัดข้อมูลจากอาร์เรย์หลักมาแสดงผลเฉพาะของหน้านั้น ๆ 🟢
  const currentOrders = orders ? orders.slice(indexOfFirstItem, indexOfLastItem) : [];

  // 4. คำนวณจำนวนหน้าทั้งหมดที่มี
  const totalPages = Math.ceil((orders?.length || 0) / itemsPerPage);

  return (
    <div className="space-y-8">
      {/* ส่วนที่ 1: กล่องสรุปสถิติจำนวนคุกกี้แต่ละประเภท แบบ Dynamic ไร้การ Hardcode ข้อมูลล่วงหน้า 🟢 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayList.map((productName) => {
          // ค้นหายอดขายรวมจากสถิติออเดอร์ที่ถูกแมทช์ด้วยคำเดียวกัน (ไม่สนใจตัวเล็กตัวใหญ่)
          const found = cookieSummary?.find(
            (c) => c.name.toLowerCase() === productName.toLowerCase()
          );

          return (
            <div key={productName} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{productName}</p>
                <p className="text-2xl font-black text-amber-600">
                  {orders && orders.length > 0 ? (found?.count || 0) : 0} <span className="text-xs text-gray-400 font-normal">ชิ้น</span>
                </p>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg">
                <Cookie className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ส่วนที่ 2: ตาราง Orders รายละเอียดการซื้อขายหลัก */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl mb-4 font-bold text-amber-900">Orders Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
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
                  {/* Order ID */}
                  <td className="py-4 px-4 text-sm font-mono text-gray-600">#{order.id}</td>
                  
                  {/* Customer Info */}
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-800">{order.user.name}</div>
                    <div className="text-xs text-gray-500">{order.user.email}</div>
                  </td>
                  
                  {/* Items List (ดึงชื่อเล่น/หรือ Topping สวยๆ มาโชว์) */}
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {order.items.map((item: any, idx) => (
                      <div key={idx} className="mb-0.5">
                        <span className="font-medium text-amber-800">{item.quantity}x</span> {item.displayName || item.name}
                      </div>
                    ))}
                  </td>
                  
                  {/* Total Paid Price */}
                  <td className="py-4 px-4 font-bold text-amber-700">
                    ${order.total.toFixed(2)}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 capitalize">
                      {order.status}
                    </span>
                  </td>
                  
                  {/* Action Buttons */}
                  <td className="py-4 px-4">
                    <button className="p-2 hover:bg-amber-50 rounded-full text-amber-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-10 text-gray-400">No orders found.</div>
          )}
        </div>

        {/* Pagination Controls */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4 sm:px-6 mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, orders.length)}
              </span>{" "}
              of <span className="font-medium">{orders.length}</span> results
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}