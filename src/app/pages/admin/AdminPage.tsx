import { useEffect, useState } from "react";
import { Order } from "../../types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Edit, TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";
import { supabase } from "../../../../backend/supabaseClient";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

// TODO: change to real cookie prices
const COOKIE_PRICES: Record<string, number> = {
  "triple chocolate": 35,
  "marshmallow delight": 35,
  custom: 4.99,
};

type OrderRow = {
  id: number;
  created_at: string;
  customers:
  | {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  }
  | Array<{
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  }>
  | null;
  order_items: Array<{
    id: number;
    cookie_type: string | null;
    flavor: string | null;
    toppings: string[] | null;
    quantity: number | null;
  }> | null;
};

function formatSupabaseOrders(rows: OrderRow[]): Order[] {
  return rows.map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const orderItems = Array.isArray(row.order_items) ? row.order_items : row.order_items ?? [];
    const items = orderItems.map((item) => {
      const cookieType = item.cookie_type?.trim() || "Custom Cookie";
      const isCustom = cookieType.toLowerCase().includes("custom");
      const flavors = [item.flavor, ...(item.toppings ?? [])].filter(
        (flavor): flavor is string => Boolean(flavor)
      );
      const normalizedKey = cookieType.toLowerCase();
      const price = COOKIE_PRICES[normalizedKey] ?? (isCustom ? COOKIE_PRICES.custom : 0);

      return {
        id: String(item.id),
        name: isCustom && flavors.length > 0 ? `Custom Cookie (${flavors.join(", ")})` : cookieType,
        type: isCustom ? ("custom" as const) : ("menu" as const),
        price,
        flavors: flavors.length > 0 ? flavors : undefined,
        quantity: item.quantity ?? 0,
      };
    });

    return {
      id: String(row.id),
      user: {
        name: customer?.name ?? "Unknown Customer",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        address: customer?.address ?? "",
        role: "user",
      },
      items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: "pending",
      createdAt: new Date(row.created_at),
    };
  });
}

export function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          customers (
            name,
            email,
            phone,
            address
          ),
          order_items (
            id,
            cookie_type,
            flavor,
            toppings,
            quantity
          )
        `)
        .order("created_at", { ascending: false });

      if (!isActive) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setOrders([]);
      } else {
        setOrders(formatSupabaseOrders((data ?? []) as unknown as OrderRow[]));
      }

      setLoading(false);
    };

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
          Loading admin data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-6 border border-red-200 text-red-700">
          Failed to load admin data: {error}
        </div>
      </div>
    );
  }

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
                        className={`inline-block px-3 py-1 rounded-full text-sm capitalize ${order.status === "completed"
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
