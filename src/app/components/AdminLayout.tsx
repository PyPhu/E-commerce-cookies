import { Outlet, Link } from "react-router";
import { RiAdminFill, RiHome4Line } from "react-icons/ri";
import { AiTwotoneBug } from "react-icons/ai";
import { MdStorefront, MdStore } from "react-icons/md";
import { useAuth } from "./AdminAuth";
import { supabase } from "../../../backend/supabaseClient";
import { useEffect, useState } from "react";

const CLOSE_PRODUCT_NAME = "Close"; // matches item name in your DB

export function AdminLayout() {
  const { user } = useAuth();
  const [isShopClosed, setIsShopClosed] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Check current shop status on mount
  useEffect(() => {
    const checkShopStatus = async () => {
      const { data } = await supabase
        .from("products")
        .select("show")
        .eq("item", "Close")
        .single();

      setIsShopClosed(data?.show === true);
    };
    checkShopStatus();
  }, []);

  const handleToggleShop = async () => {
    setToggling(true);
    try {
      if (!isShopClosed) {
        // --- CLOSE SHOP ---
        // 1. Hide all real products (everything except "Close")
        await supabase
          .from("products")
          .update({ show: false })
          .neq("item", "Close");

        // 2. Show the "Close" notice product
        await supabase
          .from("products")
          .update({ show: true })
          .eq("item", "Close");

        setIsShopClosed(true);
      } else {
        // --- OPEN SHOP ---
        // 1. Hide the "Close" notice product
        await supabase
          .from("products")
          .update({ show: false })
          .eq("item", "Close");

        // 2. Restore all real products
        await supabase
          .from("products")
          .update({ show: true })
          .neq("item", "Close")
          .neq("item", "Custom Cookie Set")
          .neq("item", "Additional Toppings");

        setIsShopClosed(false);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 bg-slate-900 text-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">

          <div className="flex items-center gap-8">
            <Link to="/admin" className="flex items-center gap-2 hover:text-yellow-400 transition-colors">
              <RiAdminFill className="w-6 h-6 text-yellow-400" />
              <span className="font-bold text-xl uppercase tracking-wider">Admin Center</span>
            </Link>
            {user && (
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                Logged in as: {user.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">

            {/* Shop status pill */}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isShopClosed ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"
            }`}>
              {isShopClosed ? "● Closed" : "● Open"}
            </span>

            {/* Close / Open Shop Toggle */}
            <button
              onClick={handleToggleShop}
              disabled={toggling}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded transition-colors font-semibold disabled:opacity-50 ${
                isShopClosed
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }`}
            >
              {isShopClosed ? <MdStorefront className="w-4 h-4" /> : <MdStore className="w-4 h-4" />}
              {toggling ? "Updating..." : isShopClosed ? "Open Shop" : "Close Shop"}
            </button>

            <Link
              to="/admin/products"
              className="flex items-center gap-2 text-slate-300 hover:text-white text-sm border-l border-slate-700 pl-4"
            >
              <AiTwotoneBug />
              <span>edit products</span>
            </Link>

            {/* Exit Link */}
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-300 hover:text-white text-sm border-l border-slate-700 pl-4"
            >
              <RiHome4Line />
              <span>Exit to Shop</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[80vh]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}