import { useEffect, useState } from "react";
import { Order } from "../../types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Users, LayoutDashboard, Table as TableIcon } from "lucide-react"; // เพิ่ม Icon สำหรับ Tab
import { supabase } from "../../../../backend/supabaseClient";
import { AdminTables } from "./TableAdminPage";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

const COOKIE_PRICES: Record<string, number> = {
  "triple chocolate": 35,
  "marshmallow delight": 35,
  custom: 4.99,
};

type OrderRow = {
  id: number;
  created_at: string;
  customers: any; // ปรับให้กระชับขึ้นในการอ่าน
  order_items: any;
};

function formatSupabaseOrders(rows: OrderRow[]): Order[] {
  return rows.map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const orderItems = Array.isArray(row.order_items) ? row.order_items : row.order_items ?? [];
    const items = orderItems.map((item: any) => {
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
      total: items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
      status: "pending",
      createdAt: new Date(row.created_at),
    };
  });
}

export function AdminPage() {
  // --- States ---
  const [activeTab, setActiveTab] = useState<"overview" | "tables">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Data ---
  useEffect(() => {
    let isActive = true;
    const loadOrders = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`id, created_at, customers (name, email, phone, address), order_items (id, cookie_type, flavor, toppings, quantity)`)
        .order("created_at", { ascending: false });

      if (!isActive) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setOrders(formatSupabaseOrders((data ?? []) as unknown as OrderRow[]));
      }
      setLoading(false);
    };
    loadOrders();
    return () => { isActive = false; };
  }, []);

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setEditingOrderId(null);
  };

  // --- Calculations ---
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, order: Order) => sum + order.total, 0);
  const totalCookies = orders.reduce(
  (sum: number, order: Order) => 
    sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0),
  0
);

  const customerStats = orders.reduce((acc, order) => {
    const existing = acc.find(c => c.email === order.user.email);
    if (existing) {
      existing.orders += 1;
      existing.revenue += order.total;
    } else {
      acc.push({ name: order.user.name, email: order.user.email, phone: order.user.phone, orders: 1, revenue: order.total });
    }
    return acc;
  }, [] as any[]);

  const ordersByDate = orders.reduce((acc, order) => {
    const date = order.createdAt.toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) { existing.orders += 1; existing.revenue += order.total; }
    else { acc.push({ date, orders: 1, revenue: order.total }); }
    return acc;
  }, [] as any[]);

  const cookieTypeData = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const type = item.type === 'menu' ? item.name : 'Custom Cookie';
      const existing = acc.find(c => c.name === type);
      if (existing) existing.count += item.quantity;
      else acc.push({ name: type, count: item.quantity });
    });
    return acc;
  }, [] as any[]);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const thisWeekOrders = orders.filter(o => o.createdAt >= startOfWeek);

  const flavorData = thisWeekOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      item.flavors?.forEach(flavor => {
        const existing = acc.find((f: any) => f.flavor === flavor);
        if (existing) existing.count += item.quantity;
        else acc.push({ flavor, count: item.quantity });
      });
    });
    return acc;
  }, [] as any[]).sort((a, b) => b.count - a.count);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 text-center">Loading...</div>;
  if (error) return <div className="max-w-7xl mx-auto px-4 py-12 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        
        {/* --- Tab Navigation --- */}
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              activeTab === "overview" ? "bg-white shadow-md text-amber-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              activeTab === "tables" ? "bg-white shadow-md text-amber-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <TableIcon className="w-4 h-4" /> Data Tables
          </button>
        </div>
      </div>

      {/* --- Top Stats (แสดงทั้งสองหน้า) --- */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Orders" value={totalOrders} icon={<ShoppingCart className="text-amber-600" />} />
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-green-600" />} />
        <StatCard title="Cookies Sold" value={totalCookies} icon={<TrendingUp className="text-blue-600" />} />
        <StatCard title="Customers" value={customerStats.length} icon={<Users className="text-purple-600" />} />
      </div>

      {/* --- Conditional Content --- */}
      {activeTab === "overview" ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid md:grid-cols-2 gap-8">
            <ChartCard title="Orders by Date">
              <LineChart data={ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" /> <YAxis /> <Tooltip /> <Legend />
                <Line type="monotone" dataKey="orders" stroke="#f59e0b" />
              </LineChart>
            </ChartCard>
            <ChartCard title="Revenue by Date">
              <BarChart data={ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" /> <YAxis /> <Tooltip /> <Legend />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ChartCard>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ChartCard title="Cookie Types Sold">
              <PieChart>
                <Pie data={cookieTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={({name}) => name}>
                  {cookieTypeData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartCard>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl mb-4">Flavors to Make This Week</h2>
              <div className="grid grid-cols-2 gap-4">
                {flavorData.map((f: any) => (
                  <div key={f.flavor} className="bg-amber-50 p-4 rounded-lg text-center border border-amber-100">
                    <p className="text-sm capitalize text-gray-600">{f.flavor}</p>
                    <p className="text-2xl font-bold text-amber-600">{f.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- Tables Component --- */
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <AdminTables /> 
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: any, icon: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-b-4 border-amber-500">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 font-medium">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl mb-4 font-semibold text-gray-800">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}