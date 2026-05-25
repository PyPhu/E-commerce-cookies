import { Cookie, Edit } from "lucide-react";
import { Order } from "../../types";

interface AdminTablesProps {
  orders: Order[];
  cookieSummary: any[];
}

export function AdminTables({ orders, cookieSummary }: AdminTablesProps) {
  // สอดคล้องกับคีย์ Name จริงที่ได้มาจากการ Join ตาราง products
  const defaultCookies = [
    { name: "triple chocolate", label: "Triple Chocolate" },
    { name: "marshmallow delight", label: "Marshmallow Delight" },
    { name: "custom cookie", label: "Custom Cookie" }
  ];

  return (
    <div className="space-y-8">
      {/* ส่วนที่ 1: กล่องสรุปสถิติจำนวนคุกกี้แต่ละประเภท */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {defaultCookies.map((cookie) => {
          const found = cookieSummary?.find(
            (c) => c.name.toLowerCase() === cookie.name.toLowerCase()
          );

          return (
            <div key={cookie.name} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cookie.label}</p>
                <p className="text-2xl font-black text-amber-600">
                  {orders && orders.length > 0 ? (found?.count || 0) : 0}
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
              {orders?.map((order) => (
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
      </div>
    </div>
  );
}