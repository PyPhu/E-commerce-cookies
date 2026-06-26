import { useEffect, useState } from "react";
import { Order } from "../../types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Users, LayoutDashboard, Table as TableIcon } from "lucide-react";
import { supabase } from "../../../../backend/supabaseClient";
import { AdminTables } from "./TableAdminPage";
import { useNavigate } from "react-router";
import { toast } from 'sonner';

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

// โครงสร้างสำหรับรับข้อมูลรายชื่อจากตาราง products
type ProductRow = {
  id: number;
  item: string;
  price: number;
  texture: string | null;
  flavor: string | null;
};

type OrderRow = {
  id: number;
  created_at: string;
  status: string;
  price_paid: number;
  customers: any;
  tracking_number?: string;
  shipping_price?: number;
  order_items: Array<{
    id: number;
    name: string | null; // ดึงฟิลด์ name ตามโครงสร้างจริงใน Schema ของคุณ
    flavor: string[] | null;
    texture: string | null;
    toppings: string[] | null;
    quantity: number;
    price: number;
    custom_message: string | null;
  }>;
};

function formatSupabaseOrders(rows: OrderRow[]): Order[] {
  return rows.map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const orderItems = Array.isArray(row.order_items) ? row.order_items : row.order_items ?? [];

    const totalQuantityInOrder = orderItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    const totalPricePaid = row.price_paid ?? 0;

    const items = orderItems.map((item) => {
      // ดึงค่า name จากตาราง order_items โดยตรง หากไม่มี (เป็นค่าว่าง) ให้มองเป็น Custom Cookie
      const rawName = item.name ? item.name.trim() : "Custom Cookie";
      
      const toppingsList = item.toppings ?? [];
      
      // จัดรูปแบบชื่อที่จะนำไปแสดงในตารางให้สวยงาม (เช่น Crisp Triple Chocolate)
      const baseDisplayName = item.texture ? `${item.texture} ${rawName}` : rawName;
      const displayName = toppingsList.length > 0 ? `${baseDisplayName} (${toppingsList.join(", ")})` : baseDisplayName;

      return {
        id: String(item.id),
        name: rawName, // ใช้ชื่อดิบนี้เป็น Key ในการดึงสถิติไปจับคู่ (Match)
        displayName: displayName,
        type: rawName.toLowerCase().includes("custom") ? ("custom" as const) : ("menu" as const),
        price: item.price ?? 0,
        flavor: item.flavor ?? [],
        texture: item.texture ?? '',
        toppings: item.toppings ?? [],
        quantity: item.quantity ?? 0,
        custom_message: (item as any).custom_message ?? '' 
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
      total: totalPricePaid,
      status: (row.status || "pending") as Order["status"],
      createdAt: new Date(row.created_at),
      trackingNumber: row.tracking_number,
      shippingPrice: row.shipping_price ?? 0,
      slipUrl: (row as any).slip_url ?? '', // ดึงค่า slip_url จาก Supabase
    };
  });
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "tables">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]); // 🌟 State เก็บรายชื่อสินค้าจริง
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;
    const loadDashboardData = async () => {
      setLoading(true);

      // 1. ดึงข้อมูลออเดอร์
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, 
          created_at, 
          status,
          price_paid,
          customers (name, email, phone, address), 
          tracking_number,
          shipping_price,
          slip_url,
          order_items (
            id, 
            name,
            texture,
            flavor, 
            toppings, 
            quantity,
            price,
            custom_message
          )
        `)
        .order("created_at", { ascending: false });

      // 2. ดึงข้อมูลจากตารางสินค้าหลัก (Products Table) 🌟
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("item");

      if (!isActive) return;

      if (ordersError || productsError) {
        setError(ordersError?.message || productsError?.message || "Fetch error");
      } else {
        // แปรรูปข้อมูลสินค้ารองรับการทำกล่องสถิติแบบไดนามิก
        const productNames = (productsData as ProductRow[] ?? []).map(p => p.item.trim());
        setAvailableProducts(productNames);
        
        setOrders(formatSupabaseOrders((ordersData ?? []) as unknown as OrderRow[]));
      }
      setLoading(false);
    };

    loadDashboardData();
    return () => { isActive = false; };
  }, []);
  // ดักฟัง Session Expired ระหว่างเปิดหน้าเว็บทิ้งไว้
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event เกิดขึ้นใน Checkout:", event);

      if (event === 'SIGNED_OUT' || !session) {
        toast.error("Your session has expired. Returning to homepage.");
        
        navigate("/", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalCookies = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const customerStats = orders.reduce((acc, order) => {
    const existing = acc.find(c => c.email === order.user.email);
    if (existing) { existing.orders += 1; existing.revenue += order.total; }
    else { acc.push({ name: order.user.name, email: order.user.email, phone: order.user.phone, orders: 1, revenue: order.total }); }
    return acc;
  }, [] as any[]);

  const ordersByDate = orders.reduce((acc, order) => {
    const date = order.createdAt.toLocaleDateString('en-US');
    const existing = acc.find(d => d.date === date);
    if (existing) { existing.orders += 1; existing.revenue += order.total; }
    else { acc.push({ date, orders: 1, revenue: order.total }); }
    return acc;
  }, [] as any[]);

  // สรุปยอดนับคุกกี้แยกรายประเภท
  const cookieTypeData = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const type = item.name;
      const existing = acc.find(c => c.name.toLowerCase() === type.toLowerCase());
      if (existing) {
        existing.count += item.quantity;
      } else {
        acc.push({ name: type, count: item.quantity });
      }
    });
    return acc;
  }, [] as any[]);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const thisWeekOrders = orders.filter(o => o.createdAt >= startOfWeek);

  //  โค้ดใหม่ที่รองรับทั้งรสชาติเดี่ยว (String) และหลายรสชาติ (Array)
const flavorData = thisWeekOrders.reduce((acc, order) => {
  order.items.forEach(item => {
    // ตรวจสอบว่า item.flavor มีข้อมูลและเป็น Array จริงๆ
    if (item.flavor && Array.isArray(item.flavor)) {
      
      item.flavor.forEach((singleFlavor) => {
        // ตรวจสอบความปลอดภัย: ข้ามข้อมูลที่เป็นค่าว่าง หรือไม่ใช่ string
        if (!singleFlavor || typeof singleFlavor !== "string") return;
        
        const cleanFlavor = singleFlavor.trim();
        if (!cleanFlavor) return; // ถ้า trim แล้วเป็นค่าว่างก็ให้ข้ามไป
        
        // ค้นหาว่าในตัวสะสม (acc) มีรสชาตินี้อยู่แล้วหรือยัง
        const existing = acc.find(
          (f: any) => typeof f.flavor === "string" && f.flavor.toLowerCase() === cleanFlavor.toLowerCase()
        );

        if (existing) {
          existing.count += item.quantity;
        } else {
          acc.push({ flavor: cleanFlavor, count: item.quantity });
        }
      });

    }
  });
  return acc;
}, [] as any[]).sort((a, b) => b.count - a.count);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Loading Data...</div>;
  if (error) return <div className="max-w-7xl mx-auto px-4 py-12 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* ... ส่วนของ Layout Dashboard เหมือนเดิมทุกประการ ... */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-100 p-1 rounded-xl shadow-inner w-full sm:w-auto">
          <button onClick={() => setActiveTab("overview")} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === "overview" ? "bg-white shadow-md text-amber-600" : "text-gray-500 hover:text-gray-700"}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button onClick={() => setActiveTab("tables")} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === "tables" ? "bg-white shadow-md text-amber-600" : "text-gray-500 hover:text-gray-700"}`}>
            <TableIcon className="w-4 h-4" /> Data Tables
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Orders" value={totalOrders} icon={<ShoppingCart className="text-amber-600" />} />
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-green-600" />} />
        <StatCard title="Cookies Sold" value={totalCookies} icon={<TrendingUp className="text-blue-600" />} />
        <StatCard title="Customers" value={customerStats.length} icon={<Users className="text-purple-600" />} />
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {/* ส่งรายชื่อเมนูสินค้าหลักที่ดึงจากฐานข้อมูลเข้าไปทำงานด้วย 🌟 */}
          <AdminTables orders={orders || []} cookieSummary={cookieTypeData} availableProducts={availableProducts} />
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

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return ( 
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl mb-4 font-semibold text-gray-800">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        {children as any}
      </ResponsiveContainer>
    </div>
  );
}