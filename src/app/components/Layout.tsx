import { Outlet, Link } from "react-router";
import { ShoppingCart, Cookie, User } from "lucide-react";

export function UserLayout() {
  return (
    <div className="min-h-screen bg-[#fdf9f6]">
      <header className="flex justify-between items-center p-4 bg-[#fff4e9] shadow">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Cookie className="w-6 h-6" />
          <span className="text-2xl font-bold">Kamin Cookies</span>
        </Link>

        {/* User Navigation */}
        <nav className="flex gap-6 items-center">
          <Link to="/cart" className="flex items-right gap-1">
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
          </Link>
          <Link to="/profile" className="flex items-right gap-1">
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