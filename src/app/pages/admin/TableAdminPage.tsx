import { Edit } from "lucide-react";

export function AdminTables() {
  // สร้างข้อมูลจำลอง (Mock Data) สั้นๆ เพื่อให้เห็นภาพตาราง
  const mockOrders = [
    { id: "ORD001", name: "John Doe", items: "2x Triple Chocolate", total: 70, status: "pending" },
    { id: "ORD002", name: "Jane Smith", items: "1x Custom Cookie", total: 4.99, status: "ready" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ตาราง Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl mb-4 font-bold text-amber-900">Orders Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono">{order.id}</td>
                  <td className="py-3 px-4">{order.name}</td>
                  <td className="py-3 px-4 text-sm">{order.items}</td>
                  <td className="py-3 px-4 font-bold">${order.total}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-amber-600"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ตาราง Customers (Card เปล่า) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl mb-4 font-bold text-amber-900">Customer Directory</h2>
        <div className="py-10 text-center text-gray-400 italic">
          Customer data will appear here...
        </div>
      </div>
    </div>
  );
}