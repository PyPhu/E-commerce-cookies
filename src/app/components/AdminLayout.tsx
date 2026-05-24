import { Outlet, Link } from "react-router";
import { RiAdminFill, RiHome4Line } from "react-icons/ri";
import { useAuth } from "./AdminAuth"; 
import { supabase } from "../../../backend/supabaseClient";


export function AdminLayout() {
  const { user } = useAuth(); // สามารถดึงข้อมูล user เช่น user.email มาแสดงโชว์บนบาร์ได้

  const handleLogout = async () => {
    await supabase.auth.signOut(); // สั่ง Logout ออกจากระบบ Supabase อย่างปลอดภัย
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 bg-slate-900 text-white shadow-md">
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
            {/* Exit Link */}
            <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white text-sm border-l border-slate-700 pl-4">
              <RiHome4Line />
              <span>Exit to Shop</span>
            </Link>
            
            {/* เพิ่มปุ่มกดออกจากระบบจริง */}
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