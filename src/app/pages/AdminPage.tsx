import { useState } from "react";
import { mockOrders } from "../data/mockOrders";
import { Order } from "../types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Edit, TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

export function AdminPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    setEditingOrderId(null);
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalCookies = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const customerStats = orders.reduce((acc, order) => {
    const existing = acc.find(c => c.email === order.user.email);
    if (existing) {
      existing.orders += 1;
      existing.revenue += order.total;
    } else {
      acc.push({
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
        orders: 1,
        revenue: order.total,
      });
    }
    return acc;
  }, [] as Array<{ name: string; email: string; phone: string; orders: number; revenue: number }>);

  const ordersByDate = orders.reduce((acc, order) => {
    const date = order.createdAt.toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.orders += 1;
      existing.revenue += order.total;
    } else {
      acc.push({ date, orders: 1, revenue: order.total });
    }
    return acc;
  }, [] as Array<{ date: string; orders: number; revenue: number }>);

  const cookieTypeData = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const type = item.type === 'menu' ? item.name : 'Custom Cookie';
      const existing = acc.find(c => c.name === type);
      if (existing) {
        existing.count += item.quantity;
      } else {
        acc.push({ name: type, count: item.quantity });
      }
    });
    return acc;
  }, [] as Array<{ name: string; count: number }>);

  const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff));
  };

  const startOfWeek = getStartOfWeek();
  const thisWeekOrders = orders.filter(order => order.createdAt >= startOfWeek);

  const flavorData = thisWeekOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (item.flavors) {
        item.flavors.forEach(flavor => {
          const existing = acc.find(f => f.flavor === flavor);
          if (existing) {
            existing.count += item.quantity;
          } else {
            acc.push({ flavor, count: item.quantity });
          }
        });
      }
    });
    return acc;
  }, [] as Array<{ flavor: string; count: number }>).sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Orders</span>
            <ShoppingCart className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl">{totalOrders}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Cookies Sold</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl">{totalCookies}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Customers</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl">{customerStats.length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-4">Orders by Date</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ordersByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#f59e0b" name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-4">Revenue by Date</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-4">Cookie Types Sold</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cookieTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {cookieTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-4">Cookies by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cookieTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl mb-4">Flavors to Make This Week</h2>
        <p className="text-gray-600 mb-4">
          Based on {thisWeekOrders.length} orders this week (since {startOfWeek.toLocaleDateString()})
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {flavorData.map((flavor) => (
            <div key={flavor.flavor} className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm capitalize mb-2">{flavor.flavor}</p>
              <p className="text-3xl text-amber-600">{flavor.count}</p>
              <p className="text-xs text-gray-500 mt-1">cookies</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl mb-4">Orders Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Address</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{order.id}</td>
                  <td className="py-3 px-4">{order.user.name}</td>
                  <td className="py-3 px-4 text-sm">{order.user.phone}</td>
                  <td className="py-3 px-4 text-sm max-w-xs truncate">{order.user.address}</td>
                  <td className="py-3 px-4 text-sm">
                    {order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
                  </td>
                  <td className="py-3 px-4">${order.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {editingOrderId === order.id ? (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm capitalize ${
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
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setEditingOrderId(editingOrderId === order.id ? null : order.id)}
                      className="text-amber-600 hover:text-amber-700 p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl mb-4">Customers Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Orders</th>
                <th className="text-left py-3 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {customerStats.map((customer) => (
                <tr key={customer.email} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{customer.name}</td>
                  <td className="py-3 px-4">{customer.phone}</td>
                  <td className="py-3 px-4 text-sm">{customer.email}</td>
                  <td className="py-3 px-4">{customer.orders}</td>
                  <td className="py-3 px-4">${customer.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
