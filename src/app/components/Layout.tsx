import { Outlet, Link } from "react-router";
import { ShoppingCart, Cookie, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "./AdminAuth";

export function UserLayout() {
  const { isAdmin } = useAuth(); // 2. ดึงค่าสถานะ isAdmin ออกมาจากระบบส่วนกลาง

  return (
    <div className="min-h-screen bg-[#fdf9f6]">
      <header className="flex justify-between items-center p-4 bg-[#fff4e9] shadow gm-0 sticky top-0 z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Cookie className="w-6 h-6" />
          <span className="text-2xl font-bold">cookiekamin</span>
        </Link>

        {/* User Navigation */}
        <nav className="flex gap-6 items-center">
          
          {/* if isAdmin the hidden button will appear */}
          {isAdmin && (
            <Link 
              to="/admin" 
              className="flex items-center gap-1"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          <Link to="/cart" className="flex items-center gap-1">
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
          </Link>
          
          <Link to="/profile" className="flex items-center gap-1">
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}