import { Outlet, Link } from "react-router";
import { ShoppingCart, Cookie, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "./AdminAuth";
import Logo from "../pages/user/img/Logo.png";

export function UserLayout() {
  const { isAdmin } = useAuth(); // 2. ดึงค่าสถานะ isAdmin ออกมาจากระบบส่วนกลาง

  return (
    <div className="min-h-screen bg-[#fdf9f6]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-[#fff4e9] shadow gm-0 sticky top-0 z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="cookiekamin logo" className="w-10 h-10 rounded-full object-contain " />
          <span className="text-2xl font-bold">cookiekamin</span>
        </Link>

        {/* User Navigation */}
        <nav className="flex flex-wrap gap-4 items-center">
          {isAdmin && (
            <Link 
              to="/admin" 
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          <Link to="/cart" className="flex items-center gap-1 whitespace-nowrap">
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
          </Link>
          
          <Link to="/profile" className="flex items-center gap-1 whitespace-nowrap">
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